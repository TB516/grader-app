import { Effect, Result, Schema } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseJson } from '../../utils/response-body';
import { timeCheck } from './time-check';

const timeSchema = Schema.Struct({ time: Schema.String });

export const timeJsonGrader: Grader = {
  label: 'Time JSON Endpoint Returns Correct Time',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/timeJSON'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const json = yield* responseJson(response, 'JSON parsing failed');

      const body = Schema.decodeUnknownResult(timeSchema)(json);
      if (Result.isFailure(body)) {
        return { status: 'fail', message: 'JSON did not contain a valid "time" string', details: JSON.stringify(json) };
      }

      failure = timeCheck(body.success.time);
      if (failure) return failure;

      return {
        status: 'pass',
        message: `JSON returned the current server time '${body.success.time}'`,
        details: JSON.stringify(json)
      };
    })
};
