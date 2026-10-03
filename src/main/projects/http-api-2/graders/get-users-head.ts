import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

export const getUsersHeadGrader: Grader = {
  label: '/getUsers HEAD Returns 200 Without Body',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/getUsers'), { method: 'HEAD' });

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const text = yield* responseText(response, 'HEAD body parsing failed');
      if (text.length > 0) return { status: 'fail', message: 'HEAD response had a body', details: text };

      return { status: 'pass', message: '/getUsers HEAD returned 200 without a body', details: responseDetails(response) };
    })
};
