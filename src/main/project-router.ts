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

const gradersByProject: Record<ProjectTypes, Record<string, Grader> | null> = {
  'Simple HTTP': simpleHttpGraders,
  'Streaming Media': streamingMediaGraders,
  'HTTP API I': httpApi1Graders,
  'HTTP API II': httpApi2Graders,
  'Simple Models': simpleModelsGraders,
  'Domomaker C': domomakerCGraders
};

/** Only implemented assignments can start a run. Renderer availability comes from this registry. */
export const availableProjects = (): ProjectTypes[] => projects.filter((project) => gradersByProject[project] !== null);

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
  if (!graders) return yield* Effect.fail(new Error(`${assignment} does not have a grader yet.`));
  return { assignment, url, graders };
});
