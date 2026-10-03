import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';
import { timeCheck } from './time-check';

export const timeTextGrader: Grader = {
  label: 'Time Endpoint Returns Correct Time',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/time'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/plain');
      if (failure) return failure;

      const text = yield* responseText(response, 'Text parsing failed');

      failure = timeCheck(text);
      if (failure) return failure;

      return {
        status: 'pass',
        message: `Text returned the current server time '${text}'`,
        details: responseDetails(response)
      };
    })
};
