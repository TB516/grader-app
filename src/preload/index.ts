import { contextBridge } from 'electron';
import * as api from './api';

// Use `contextBridge` APIs to expose Electron APIs to renderer
try {
  contextBridge.exposeInMainWorld('api', api);
} catch (error) {
  console.error(error);
}
