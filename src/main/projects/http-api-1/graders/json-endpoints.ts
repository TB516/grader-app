import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { apiExpectations, checkJsonResponse, fetchWithAccept } from './response-shape';

export const jsonEndpointsGrader: Grader = {
  label: 'API Returns JSON For application/json Accept Header',
  run: (url) =>
    Effect.gen(function* () {
      for (const expectation of apiExpectations) {
        const response = yield* fetchWithAccept(url, expectation.path, 'application/json');

        yield* checkJsonResponse(response, expectation).pipe(
          Effect.mapError((failure) => ({ ...failure, message: `${expectation.path}: ${failure.message}` }))
        );
      }

      return { status: 'pass', message: 'API returned JSON for every endpoint with application/json Accept header' };
    })
};
