import { contextBridge } from 'electron';

/** The renderer's whole view of the main process. It never sees Electron directly. */
const api = {};

export type Api = typeof api;

contextBridge.exposeInMainWorld('api', api);
