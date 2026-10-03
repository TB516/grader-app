import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

export const notRealHeadGrader: Grader = {
  label: '/notReal HEAD Returns 404 Without Body',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/notReal'), { method: 'HEAD' });

      let failure = httpStatusCheck(response, 404);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const text = yield* responseText(response, 'HEAD body parsing failed');
      if (text.length > 0) return { status: 'fail', message: 'HEAD response had a body', details: text };

      return { status: 'pass', message: '/notReal HEAD returned 404 without a body', details: responseDetails(response) };
    })
};
