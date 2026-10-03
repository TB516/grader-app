import { Cause, Effect, Exit, Result, Schema } from 'effect';
import { ipcMain } from 'electron';
import type { GradingEvent } from '../shared/types';
import { createWindow } from './create-window';
import { gradingRun } from './grading-run';
import { availableProjects, projectRouter } from './project-router';

const runIdSchema = Schema.String.check(Schema.isUUID());
const gradingRequest = Schema.Struct({ runId: runIdSchema });

/** Each results window owns at most one run, which ends on cancellation, reload, or close. */
const setupIPC = (): void => {
  const activeRuns = new Map<number, { runId: string; controller: AbortController }>();

  ipcMain.handle('availableProjects', availableProjects);
  ipcMain.handle('launchTestWindow', (_event, input: unknown) => {
    const { assignment, url } = Effect.runSync(projectRouter(input));
    createWindow({ path: '/results', query: { assignment, url: url.href } });
  });

  ipcMain.on('grader:start', (event, input: unknown) => {
    const parsed = Schema.decodeUnknownResult(gradingRequest)(input);
    if (Result.isFailure(parsed)) return;
    const { runId } = parsed.success;
    const sender = event.sender;
    const senderId = sender.id;
    const emit = (update: GradingEvent): void => {
      if (!sender.isDestroyed()) sender.send('grader:event', update);
    };

    const project = Effect.runSyncExit(projectRouter(input));
    if (Exit.isFailure(project)) {
      const error = Cause.squash(project.cause);
      emit({ runId, type: 'finished', outcome: 'error', message: error instanceof Error ? error.message : 'Invalid grading request.' });
      return;
    }

    activeRuns.get(senderId)?.controller.abort();
    const controller = new AbortController();
    const run = { runId, controller };
    activeRuns.set(senderId, run);
    const cancel = (): void => controller.abort();
    const onNavigation = (_event: Electron.Event, _url: string, isInPlace: boolean, isMainFrame: boolean): void => {
      if (isMainFrame && !isInPlace) cancel();
    };
    sender.once('destroyed', cancel);
    sender.on('did-start-navigation', onNavigation);

    void Effect.runPromiseExit(gradingRun(runId, project.value.url, project.value.graders, emit), { signal: controller.signal }).then(() => {
      sender.removeListener('destroyed', cancel);
      sender.removeListener('did-start-navigation', onNavigation);
      if (activeRuns.get(senderId) === run) activeRuns.delete(senderId);
    });
  });

  ipcMain.on('grader:cancel', (event, input: unknown) => {
    const parsed = Schema.decodeUnknownResult(runIdSchema)(input);
    if (Result.isFailure(parsed)) return;
    const run = activeRuns.get(event.sender.id);
    if (run?.runId === parsed.success) run.controller.abort();
  });
};

export { setupIPC };
