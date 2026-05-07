import type { ProjectTypes, GraderRun } from '../shared/types';
import { httpApi2Runner } from './projects/http-api-2';
import { simpleHttpRunner } from './projects/simple-http';
import { streamingMediaRunner } from './projects/streaming-media';
import type { StreamingDoneFunction, StreamRunnerResultFunction } from './types';

const projectRouter = (e: Electron.IpcMainInvokeEvent, assignment: ProjectTypes, serializedUrl: string): GraderRun[] => {
  const url = new URL(serializedUrl);

  const stream: StreamRunnerResultFunction = (run: GraderRun) => {
    e.sender.send('grader:run', run);
  };

  const done: StreamingDoneFunction = () => {
    e.sender.send('grader:done');
  };

  switch (assignment) {
    case 'Simple HTTP':
      return simpleHttpRunner(url, stream, done);
    case 'Streaming Media':
      return streamingMediaRunner(url, stream, done);
    case 'HTTP API I':
      return simpleHttpRunner(url, stream, done);
    case 'HTTP API II':
      return httpApi2Runner(url, stream, done);
    case 'Simple Models':
      return simpleHttpRunner(url, stream, done);
    case 'Domomaker C':
      return simpleHttpRunner(url, stream, done);
  }
};

export { projectRouter };
