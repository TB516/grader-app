import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

export const page2Grader: Grader = {
  label: 'Page 2 Returns HTML',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/page2'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/html');
      if (failure) return failure;

      const text = yield* responseText(response, 'Text parsing failed');
      if (!text.trim()) return { status: 'fail', message: 'HTML body was empty', details: responseDetails(response) };

      return { status: 'pass', message: 'Page 2 Returned HTML', details: responseDetails(response) };
    })
};
