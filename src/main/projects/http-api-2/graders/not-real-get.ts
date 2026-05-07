import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { hasErrorShape, parseJsonResponse } from './json-shape';

export const notRealGetGrader: Grader = {
  label: '/notReal GET Returns JSON 404',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, '/notReal'));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 404);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'application/json');
    if (failure) return failure;

    const json = await parseJsonResponse(response.value, '/notReal JSON parsing failed');
    if (!json.ok) return json.result;

    if (!hasErrorShape(json.value)) {
      return {
        status: 'fail',
        message: '/notReal JSON did not contain non-empty message and id fields',
        details: JSON.stringify(json.value)
      };
    }

    return { status: 'pass', message: '/notReal returned JSON 404 with message and id', details: JSON.stringify(json.value) };
  }
};
