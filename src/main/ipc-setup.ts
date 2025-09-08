import { ipcMain } from 'electron';
import createWindow from './create-window';
import testRouter from './tests';

const setupIPC = () => {
  ipcMain.on('launchTestWindow', (_e: Electron.IpcMainEvent, assignment: string, url: string) => {
    createWindow('/results', { assignment, url });
  });

  ipcMain.handle('testProject', testRouter);
};

export default setupIPC;
