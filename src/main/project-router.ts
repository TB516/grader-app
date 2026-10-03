import { Effect, Schema } from 'effect';
import { projects } from '../shared/projects';
import type { ProjectTypes } from '../shared/types';
import { domomakerCGraders } from './projects/domomaker-c';
import { httpApi1Graders } from './projects/http-api-1';
import { httpApi2Graders } from './projects/http-api-2';
import { simpleHttpGraders } from './projects/simple-http';
import { simpleModelsGraders } from './projects/simple-models';
import { streamingMediaGraders } from './projects/streaming-media';
import type { Grader } from './types';

const gradersByProject: Record<ProjectTypes, Record<string, Grader>> = {
  'Simple HTTP': simpleHttpGraders,
  'Streaming Media': streamingMediaGraders,
  'HTTP API I': httpApi1Graders,
  'HTTP API II': httpApi2Graders,
  'Simple Models': simpleModelsGraders,
  'Domomaker C': domomakerCGraders
};

/** The registry implements every assignment in the shared display order. */
export const availableProjects = (): ProjectTypes[] => [...projects];

const projectRequest = Schema.Struct({
  assignment: Schema.Literals(projects),
  url: Schema.URLFromString.check(Schema.makeFilter((url) => url.protocol === 'http:' || url.protocol === 'https:'))
});

/** Validate renderer input once, then return the implementation and parsed URL. */
export const projectRouter = Effect.fn(function* (input: unknown) {
  const { assignment, url } = yield* Schema.decodeUnknownEffect(projectRequest)(input).pipe(
    Effect.mapError(() => new Error('Choose an assignment and enter a valid HTTP or HTTPS URL.'))
  );
  const graders = gradersByProject[assignment];
  return { assignment, url, graders };
});
