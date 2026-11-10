import { Effect, Fiber, Option, Schema, Stream } from 'effect';
import { ipcMain } from 'electron';

import { assignmentNames } from '../shared/assignments';
import { channels } from '../shared/ipc';
import { checksByAssignment } from './assignments';
import { grade } from './grading/grade';
import { createWindow } from './window';

/**
 * What a results window grades. It arrives from the launcher and again from the window's own
 * address, and both come from the page, so both are validated.
 */
const Submission = Schema.Struct({
  assignment: Schema.Literals(assignmentNames),
  url: Schema.URLFromString.check(
    Schema.makeFilter((url) => url.protocol === 'http:' || url.protocol === 'https:')
  )
});

const decodeSubmission = Schema.decodeUnknownOption(Submission);

export const setupIpc = () => {
  /** Resolves to an error message when the submission is invalid, otherwise opens its window. */
  ipcMain.handle(channels.openResults, (_event, assignment: unknown, url: unknown) => {
    const submission = decodeSubmission({ assignment, url });
    if (Option.isNone(submission)) return 'Enter a full address starting with http:// or https://';

    createWindow({
      view: 'results',
      assignment: submission.value.assignment,
      url: submission.value.url.href
    });

    return undefined;
  });

  /**
   * Grades the sending window's submission over the port it sent. The port closes when the page
   * cancels, reloads, or closes, and that stops the run.
   */
  ipcMain.on(channels.grade, (event) => {
    const [port] = event.ports;
    if (!port) return;

    const query = new URL(event.sender.getURL()).searchParams;
    const submission = decodeSubmission(Object.fromEntries(query));
    if (Option.isNone(submission)) {
      port.close();
      return;
    }

    const { assignment, url } = submission.value;
    const run = Stream.runForEach(grade(checksByAssignment[assignment], url.href), (gradingEvent) =>
      Effect.sync(() => port.postMessage(gradingEvent))
    );
    const fiber = Effect.runFork(run.pipe(Effect.ensuring(Effect.sync(() => port.close()))));

    port.on('close', () => Effect.runFork(Fiber.interrupt(fiber)));
    port.start();
  });
};
