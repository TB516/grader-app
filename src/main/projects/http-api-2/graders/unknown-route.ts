import { Effect, Result, Schema } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseJson } from '../../utils/response-body';
import { errorSchema } from './json-shape';

const UNKNOWN_ROUTE = '/__grader_unknown_route__';

export const unknownRouteGrader: Grader = {
  label: 'Unknown Routes Return 404',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, UNKNOWN_ROUTE));

      let failure = httpStatusCheck(response, 404);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const json = yield* responseJson(response, 'Unknown route JSON parsing failed');

      if (Result.isFailure(Schema.decodeUnknownResult(errorSchema)(json))) {
        return {
          status: 'fail',
          message: 'Unknown route JSON did not contain non-empty message and id fields',
          details: JSON.stringify(json)
        };
      }

      return { status: 'pass', message: 'Unknown route returned 404' };
    })
};
