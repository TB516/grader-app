import { contextBridge } from 'electron';
import * as api from './api';

// Use `contextBridge` APIs to expose our custom APIs to the renderer process
try {
  contextBridge.exposeInMainWorld('api', api);
} catch (error) {
  console.error(error);
}
