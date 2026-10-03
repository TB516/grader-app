import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

export const indexPageGrader: Grader = {
  label: 'Home Page Returns HTML',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(new URL(url));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/html');
      if (failure) return failure;

      const text = yield* responseText(response, 'Text parsing failed');
      if (!text.trim()) return { status: 'fail', message: 'HTML body was empty', details: responseDetails(response) };

      return { status: 'pass', message: 'Home page returned HTML', details: responseDetails(response) };
    })
};
