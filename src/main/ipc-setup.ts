import { ipcMain } from 'electron';
import createWindow from './create-window';
import testRouter from './tests';
import { ProjectTypes } from '../../resources/projects';

const setupIPC = () => {
  ipcMain.on(
    'launchTestWindow',
    (_e: Electron.IpcMainEvent, assignment: ProjectTypes, url: string) =>
      createWindow('/results', { assignment, url })
  );

  ipcMain.handle(
    'testProject',
    (_e: Electron.IpcMainInvokeEvent, assignment: ProjectTypes, url: string) =>
      testRouter(assignment, url)
  );
};

export default setupIPC;
