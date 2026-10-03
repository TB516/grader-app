import { Effect, Result, Schema } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseJson } from '../../utils/response-body';

const EXPECTED_MESSAGE = 'Hello World';
const helloSchema = Schema.Struct({ message: Schema.Literal(EXPECTED_MESSAGE) });

export const helloJsonGrader: Grader = {
  label: 'Hello JSON Endpoint Returns {"message":"Hello World"}',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/helloJSON'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const json = yield* responseJson(response, 'JSON parsing failed');

      if (Result.isFailure(Schema.decodeUnknownResult(helloSchema)(json))) {
        return {
          status: 'fail',
          message: `JSON was not {"message":"${EXPECTED_MESSAGE}"}`,
          details: JSON.stringify(json)
        };
      }

      return {
        status: 'pass',
        message: `JSON was {"message":"${EXPECTED_MESSAGE}"}`,
        details: JSON.stringify(json)
      };
    })
};
