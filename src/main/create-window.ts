import { shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

/**
 * Creates a new app window
 * @param hash String value of the hash path value
 * @param query Record containing keys and values for the query parameters
 */
function createWindow(hash: string = '/', query: Record<string, string> = {}): void {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  window.on('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(
      `${process.env['ELECTRON_RENDERER_URL']}#${hash}?${new URLSearchParams(query).toString()}`
    );
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), { hash: hash, query: query });
  }
}

export default createWindow;
