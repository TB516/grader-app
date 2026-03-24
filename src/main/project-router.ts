import { ProjectTypes } from '../../resources/projects';
import simpleHttp from './projects/simple-http';
import streamingMedia from './projects/streaming-media';
import httpApiI from './projects/http-api-I';
import httpApiII from './projects/http-api-II';
import domomakerC from './projects/domomaker-c';
import domomakerE from './projects/domomaker-e';

/**
 * Takes the assignment and invokes the corresponding test suit
 * @param assignment Assignment to route by
 * @param url Project URL
 */
const projectRouter = (assignment: ProjectTypes, url: string) => {
  switch (assignment) {
    case 'Simple HTTP':
      return simpleHttp(url);
    case 'Streaming Media':
      return streamingMedia(url);
    case 'HTTP API I':
      return httpApiI(url);
    case 'HTTP API II':
      return httpApiII(url);
    case 'Domomaker C':
      return domomakerC(url);
    case 'Domomaker E':
      return domomakerE(url);
  }
};

export default projectRouter;
