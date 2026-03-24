import { ProjectTypes } from '../../../resources/projects';

/**
 * Takes the assignment and invokes the corresponding test suit
 * @param _e Electron Invoke Event
 * @param assignment Assignment to route by
 * @param url Project URL
 */
const testRouter = (assignment: ProjectTypes, url: string) => {
  switch (assignment) {
    case 'Simple HTTP':
      return;
    case 'Streaming Media':
      return;
    case 'HTTP API I':
      return;
    case 'HTTP API II':
      return;
    case 'Domomaker C':
      return;
    case 'Domomaker E':
      return;
  }

  console.log(url);
};

export default testRouter;
