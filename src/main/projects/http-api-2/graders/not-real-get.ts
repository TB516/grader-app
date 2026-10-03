import { Effect, Result, Schema } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseJson } from '../../utils/response-body';
import { errorSchema } from './json-shape';

export const notRealGetGrader: Grader = {
  label: '/notReal GET Returns JSON 404',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/notReal'));

      let failure = httpStatusCheck(response, 404);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const json = yield* responseJson(response, '/notReal JSON parsing failed');

      if (Result.isFailure(Schema.decodeUnknownResult(errorSchema)(json))) {
        return {
          status: 'fail',
          message: '/notReal JSON did not contain non-empty message and id fields',
          details: JSON.stringify(json)
        };
      }

      return { status: 'pass', message: '/notReal returned JSON 404 with message and id', details: JSON.stringify(json) };
    })
};
