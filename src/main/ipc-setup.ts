import { ipcMain } from 'electron';
import createWindow from './create-window';

const setupIPC = () => {
  ipcMain.on('launchTestWindow', (_e: Electron.IpcMainEvent, assignment: string, url: string) => {
    createWindow('/results', { assignment, url });
  });
};

export default setupIPC;
