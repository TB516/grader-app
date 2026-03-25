import { ipcMain } from 'electron';
import type { ProjectTypes, GraderRun } from '../shared/types';
import { createWindow } from './create-window';
import { projectRouter } from './project-router';
import type { StreamRunnerResultFunction, StreamingDoneFunction } from './types';

const setupIPC = () => {
  ipcMain.on('launchTestWindow', (_e: Electron.IpcMainEvent, assignment: ProjectTypes, url: string) =>
    createWindow({ path: '/results', query: { assignment, url } })
  );

  ipcMain.handle('testProject', (e: Electron.IpcMainInvokeEvent, assignment: ProjectTypes, url: string) => {
    const stream: StreamRunnerResultFunction = (run: GraderRun) => {
      e.sender.send('grader:run', run);
    };

    const done: StreamingDoneFunction = () => {
      e.sender.send('grader:done');
    };

    return projectRouter(assignment, url, stream, done);
  });
};

export { setupIPC };
