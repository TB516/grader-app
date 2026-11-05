import { electronApp, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow } from 'electron';

import { createWindow } from './window';

app.whenReady().then(() => {
  electronApp.setAppUserModelId('io.github.tb516.grader-app');

  // F12 toggles DevTools in development; reload shortcuts are disabled in production.
  app.on('browser-window-created', (_event, window) =>
    optimizer.watchWindowShortcuts(window, { zoom: true })
  );

  createWindow();

  // macOS keeps the app running without windows, so reopen one from the dock.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
