/// The renderer sees typed data and operations, never Electron or the Effect runtime.
import { ipcRenderer } from 'electron';
import type { GradingEvent, GradingRequest, ProjectTypes } from '../shared/types';

const availableProjects = (): Promise<ProjectTypes[]> => ipcRenderer.invoke('availableProjects');

const launchTester = (assignment: ProjectTypes, url: string): Promise<void> => ipcRenderer.invoke('launchTestWindow', { assignment, url });

const cancelGrading = (runId: string): void => ipcRenderer.send('grader:cancel', runId);

/** Subscribe before starting; all events for this run arrive on the same channel. Cleanup cancels the run. */
const gradeProject = (request: GradingRequest, callback: (event: GradingEvent) => void): VoidFunction => {
  const listener = (_event: Electron.IpcRendererEvent, event: GradingEvent): void => {
    if (event.runId === request.runId) callback(event);
  };
  ipcRenderer.on('grader:event', listener);
  ipcRenderer.send('grader:start', request);
  return () => {
    ipcRenderer.removeListener('grader:event', listener);
    cancelGrading(request.runId);
  };
};

export { availableProjects, launchTester, gradeProject, cancelGrading };
