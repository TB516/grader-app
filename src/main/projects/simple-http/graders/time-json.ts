import { Effect, Result, Schema } from 'effect';
import { Temporal } from 'temporal-polyfill';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { parseTimeString } from '../../utils/parse-time-string';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseJson } from '../../utils/response-body';
import { WIGGLE_ROOM } from './time-text';

const timeSchema = Schema.Struct({ time: Schema.String });

export const timeJsonGrader: Grader = {
  label: 'Time JSON Endpoint Returns Correct Time',
  run: (url) =>
    Effect.gen(function* () {
      const expectedTime = Temporal.Now.plainTimeISO('UTC');
      const response = yield* request(projectUrl(url, '/timeJSON'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const json = yield* responseJson(response, 'JSON parsing failed');

      const body = Schema.decodeUnknownResult(timeSchema)(json, { onExcessProperty: 'error' });
      if (Result.isFailure(body)) {
        return { status: 'fail', message: 'JSON did not contain a valid "time" string', details: JSON.stringify(json) };
      }

      const responseTime = parseTimeString(body.success.time);
      if (!responseTime) return { status: 'fail', message: `Failed to parse time '${body.success.time}'`, details: JSON.stringify(json) };

      const diff = Math.abs(responseTime.until(expectedTime).total({ unit: 'seconds' }));
      const wrappedDif = Math.min(diff, 86400 - diff);

      if (wrappedDif >= WIGGLE_ROOM) {
        return {
          status: 'fail',
          message: `JSON time was '${body.success.time}', which is not '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}s`,
          details: JSON.stringify(json)
        };
      }

      return {
        status: 'pass',
        message: `JSON time was '${body.success.time}', which is '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}s`,
        details: JSON.stringify(json)
      };
    })
};
