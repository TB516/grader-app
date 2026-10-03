import { Effect } from 'effect';
import { Temporal } from 'temporal-polyfill';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { parseTimeString } from '../../utils/parse-time-string';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

export const WIGGLE_ROOM = 60;

export const timeTextGrader: Grader = {
  label: 'Time Endpoint Returns Correct Time',
  run: (url) =>
    Effect.gen(function* () {
      const expectedTime = Temporal.Now.plainTimeISO('UTC');
      const response = yield* request(projectUrl(url, '/time'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/plain');
      if (failure) return failure;

      const text = yield* responseText(response, 'Text parsing failed');

      const responseTime = parseTimeString(text);
      if (!responseTime) return { status: 'fail', message: `Failed to parse time '${text}'`, details: responseDetails(response) };

      const diff = Math.abs(responseTime.until(expectedTime).total({ unit: 'seconds' }));
      const wrappedDif = Math.min(diff, 86400 - diff);

      if (wrappedDif >= WIGGLE_ROOM)
        return {
          status: 'fail',
          message: `Text was '${text}', which is not '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}s`,
          details: responseDetails(response)
        };

      return {
        status: 'pass',
        message: `Text was '${text}', which is '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}s`,
        details: responseDetails(response)
      };
    })
};
