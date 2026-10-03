import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { apiExpectations, checkJsonResponse, fetchWithAccept } from './response-shape';

export const jsonDefaultGrader: Grader = {
  label: 'API Defaults To JSON Without Accept Header',
  run: (url) =>
    Effect.gen(function* () {
      for (const expectation of apiExpectations) {
        const response = yield* fetchWithAccept(url, expectation.path, undefined);

        yield* checkJsonResponse(response, expectation).pipe(
          Effect.mapError((failure) => ({ ...failure, message: `${expectation.path}: ${failure.message}` }))
        );
      }

      return { status: 'pass', message: 'API defaulted to JSON for every endpoint' };
    })
};
