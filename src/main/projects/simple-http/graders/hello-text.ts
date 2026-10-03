import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

const EXPECTED_TEXT = 'Hello World';

export const helloTextGrader: Grader = {
  label: 'Hello Endpoint Returns "Hello World"',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/hello'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/plain');
      if (failure) return failure;

      const text = yield* responseText(response, 'Text parsing failed');

      if (text !== EXPECTED_TEXT) return { status: 'fail', message: `Text was not '${EXPECTED_TEXT}'`, details: responseDetails(response) };

      return {
        status: 'pass',
        message: `Text was '${EXPECTED_TEXT}'`,
        details: responseDetails(response)
      };
    })
};
