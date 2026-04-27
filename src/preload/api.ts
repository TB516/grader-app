/// Bridge file that exposes the IPC emitter wrappers to the renderer through the window API
/// Functions can be exported directly and will be auto wrapped by the contextBridge
import { ipcRenderer } from 'electron';
import type { GraderRun, ProjectTypes } from '../shared/types';

const launchTester = (assignment: ProjectTypes, url: string) => ipcRenderer.send('launchTestWindow', assignment, url);

const testProject = (assignment: ProjectTypes, url: string) => ipcRenderer.invoke('testProject', assignment, url);

const subscribeToGraderUpdate = (callback: (run: GraderRun) => void): VoidFunction => {
  const listener = (_event: Electron.IpcRendererEvent, run: GraderRun) => callback(run);

  ipcRenderer.on('grader:run', listener);

  return () => ipcRenderer.removeListener('grader:run', listener);
};

const subscribeToGraderDone = (callback: VoidFunction): VoidFunction => {
  const listener = () => {
    callback();
    ipcRenderer.removeListener('grader:done', listener);
  };

  ipcRenderer.on('grader:done', listener);

  return () => ipcRenderer.removeListener('grader:done', listener);
};

export { launchTester, subscribeToGraderDone, subscribeToGraderUpdate, testProject };
