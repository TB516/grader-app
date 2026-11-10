import { join } from 'node:path';

import { is } from '@electron-toolkit/utils';
import { BrowserWindow } from 'electron';

import icon from '../../resources/icon.png?asset';

/**
 * Opens a window on the renderer page. `query` becomes the page's address parameters: `view` picks
 * the page, and a results window also carries the submission it grades.
 */
export const createWindow = (query: Record<string, string>): BrowserWindow => {
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
    void window.loadURL(`${rendererUrl}?${new URLSearchParams(query)}`);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'), { query });
  }

  return window;
};
