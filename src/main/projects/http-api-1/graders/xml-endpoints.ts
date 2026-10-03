import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { apiExpectations, checkXmlResponse, fetchWithAccept } from './response-shape';

export const xmlEndpointsGrader: Grader = {
  label: 'API Returns XML For text/xml Accept Header',
  run: (url) =>
    Effect.gen(function* () {
      for (const expectation of apiExpectations) {
        const response = yield* fetchWithAccept(url, expectation.path, 'text/xml');

        yield* checkXmlResponse(response, expectation).pipe(
          Effect.mapError((failure) => ({ ...failure, message: `${expectation.path}: ${failure.message}` }))
        );
      }

      return { status: 'pass', message: 'API returned XML for every endpoint with text/xml Accept header' };
    })
};
