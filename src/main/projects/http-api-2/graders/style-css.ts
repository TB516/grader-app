import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

export const styleCssGrader: Grader = {
  label: 'Style CSS Returns text/css',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/style.css'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/css');
      if (failure) return failure;

      const text = yield* responseText(response, 'CSS text parsing failed');
      if (!text.trim()) return { status: 'fail', message: 'CSS body was empty', details: responseDetails(response) };

      return { status: 'pass', message: 'Style CSS returned text/css', details: responseDetails(response) };
    })
};
