import { ProjectTypes } from '../../../resources/projects';

/**
 * Takes the assignment and invokes the corresponding test suit
 * @param _e Electron Invoke Event
 * @param assignment Assignment to route by
 * @param url Project URL
 */
const testRouter = (assignment: ProjectTypes, url: string) => {
  console.log(assignment, url);
};

export default testRouter;
