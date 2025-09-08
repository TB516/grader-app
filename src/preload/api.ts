/// Bridge file that exposes the IPC emitter wrappers to the renderer through the window API
/// Functions can be exported directly and will be auto wrapped by the contextBridge
import { ipcRenderer } from 'electron';

const launchTester = (assignment: string, url: string) =>
  ipcRenderer.send('launchTestWindow', assignment, url);

const testProject = (assignment: string, url: string) =>
  ipcRenderer.invoke('testProject', assignment, url);

export { launchTester, testProject };
