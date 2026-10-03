import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

type HtmlPageGraderOptions = {
  label: string;
  path: string;
  passMessage: string;
};

export const htmlPageGrader = ({ label, path, passMessage }: HtmlPageGraderOptions): Grader => ({
  label,
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, path));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/html');
      if (failure) return failure;

      const text = yield* responseText(response, 'Text parsing failed');
      if (!text.trim()) return { status: 'fail', message: 'HTML body was empty', details: JSON.stringify(response) };

      return { status: 'pass', message: passMessage, details: JSON.stringify(response) };
    })
});
