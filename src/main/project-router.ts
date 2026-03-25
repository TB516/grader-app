import { ProjectTypes, GraderRun } from '../shared/types';
import { simpleHttpRunner } from './projects/simple-http';
import { StreamingDoneFunction, StreamRunnerResultFunction } from './types';

const projectRouter = (assignment: ProjectTypes, url: string, stream: StreamRunnerResultFunction, done: StreamingDoneFunction): GraderRun[] => {
  switch (assignment) {
    case 'Simple HTTP':
      return simpleHttpRunner(url, stream, done);
    case 'Streaming Media':
      return simpleHttpRunner(url, stream, done);
    case 'HTTP API I':
      return simpleHttpRunner(url, stream, done);
    case 'HTTP API II':
      return simpleHttpRunner(url, stream, done);
    case 'Simple Models':
      return simpleHttpRunner(url, stream, done);
    case 'Domomaker C':
      return simpleHttpRunner(url, stream, done);
  }
};

export default projectRouter;
