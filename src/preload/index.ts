import { contextBridge, ipcRenderer } from 'electron';

import type { AssignmentName } from '../shared/assignments';
import type { GradingEvent } from '../shared/grading';
import { channels } from '../shared/ipc';

/** The renderer's whole view of the main process. It never sees Electron or Effect directly. */
const api = {
  /** Opens a results window. Resolves to an error message instead when the URL is invalid. */
  openResults: (assignment: AssignmentName, url: string): Promise<string | undefined> =>
    ipcRenderer.invoke(channels.openResults, assignment, url),

  /**
   * Grades this window's submission, passing each event to `onEvent`. Each run gets its own
   * private channel; the returned function closes it, which cancels the run.
   */
  grade: (onEvent: (event: GradingEvent) => void): (() => void) => {
    const { port1, port2 } = new MessageChannel();
    port1.onmessage = (message: MessageEvent<GradingEvent>) => onEvent(message.data);
    ipcRenderer.postMessage(channels.grade, null, [port2]);

    return () => port1.close();
  }
};

export type Api = typeof api;

contextBridge.exposeInMainWorld('api', api);
