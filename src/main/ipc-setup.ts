import { ipcMain } from 'electron';
import type { ProjectTypes } from '../shared/types';
import { createWindow } from './create-window';
import { projectRouter } from './project-router';

const setupIPC = () => {
  ipcMain.on('launchTestWindow', (_e: Electron.IpcMainEvent, assignment: ProjectTypes, url: string) =>
    createWindow({ path: '/results', query: { assignment, url } })
  );

  ipcMain.handle('testProject', (e: Electron.IpcMainInvokeEvent, assignment: ProjectTypes, url: string) => projectRouter(e, assignment, url));
};

export { setupIPC };
