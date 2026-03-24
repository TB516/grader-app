import { ipcMain } from 'electron';
import createWindow from './create-window';
import projectRouter from './project-router';
import { ProjectTypes } from '../../resources/projects';

const setupIPC = () => {
  ipcMain.on('launchTestWindow', (_e: Electron.IpcMainEvent, assignment: ProjectTypes, url: string) =>
    createWindow({ path: '/results', query: { assignment, url } })
  );

  ipcMain.handle('testProject', (_e: Electron.IpcMainInvokeEvent, assignment: ProjectTypes, url: string) => projectRouter(assignment, url));
};

export default setupIPC;
