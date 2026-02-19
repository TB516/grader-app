import { shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

type createWindowArgs = {
  width?: number;
  height?: number;
  path: string;
  query: Record<string, string>;
};

/**
 * Creates a new app window
 * @param path String value of the hash path
 * @param query Record containing keys and values for the query parameters
 */
function createWindow({ width = 900, height = 670, path, query }: createWindowArgs): void {
  // Create the browser window.
  const window = new BrowserWindow({
    width: width,
    height: height,
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
    let url = process.env['ELECTRON_RENDERER_URL'];

    const queryParams = new URLSearchParams(query);
    url += queryParams.size !== 0 ? `?${queryParams.toString()}` : '';

    url += `#${path}`;

    window.loadURL(url);
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), { hash: path, query: query });
  }
}

export default createWindow;
