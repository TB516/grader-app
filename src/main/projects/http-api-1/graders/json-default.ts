import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { apiExpectations, checkJsonResponse, fetchWithAccept } from './response-shape';

export const jsonDefaultGrader: Grader = {
  label: 'API Defaults To JSON',
  run: (url) =>
    Effect.gen(function* () {
      for (const expectation of apiExpectations) {
        for (const accept of [undefined, '*/*', 'text/html']) {
          const response = yield* fetchWithAccept(url, expectation.path, accept);

          yield* checkJsonResponse(response, expectation).pipe(
            Effect.mapError((failure) => ({ ...failure, message: `${expectation.path} with ${accept ?? 'no Accept header'}: ${failure.message}` }))
          );
        }
      }

      return { status: 'pass', message: 'API defaulted to JSON for every endpoint' };
    })
};
