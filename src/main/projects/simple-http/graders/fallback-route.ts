import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

const UNKNOWN_ROUTE = '/__grader_unknown_route__';

export const fallbackRouteGrader: Grader = {
  label: 'Unknown Routes Match Index Page',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, UNKNOWN_ROUTE));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/html');
      if (failure) return failure;

      const text = yield* responseText(response, 'Fallback text parsing failed');

      if (!text.trim()) return { status: 'fail', message: 'HTML body was empty', details: responseDetails(response) };

      return { status: 'pass', message: 'Unknown route returned HTML', details: responseDetails(response) };
    })
};
