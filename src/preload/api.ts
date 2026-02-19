/// Bridge file that exposes the IPC emitter wrappers to the renderer through the window API
/// Functions can be exported directly and will be auto wrapped by the contextBridge
import { ipcRenderer } from 'electron';
import { ProjectTypes } from '../../resources/projects';

const launchTester = (assignment: ProjectTypes, url: string) => ipcRenderer.send('launchTestWindow', assignment, url);

const testProject = (assignment: ProjectTypes, url: string) => ipcRenderer.invoke('testProject', assignment, url);

export { launchTester, testProject };
