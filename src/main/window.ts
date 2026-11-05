import { join } from 'node:path';

import { is } from '@electron-toolkit/utils';
import { BrowserWindow } from 'electron';

import icon from '../../resources/icon.png?asset';

export const createWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  });

  window.on('ready-to-show', () => window.show());

  // Nothing in the app opens new windows from the page itself.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (is.dev && rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
};
