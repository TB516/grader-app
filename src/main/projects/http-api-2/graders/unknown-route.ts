import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { errorSchema, parseJsonResponse } from './json-shape';

const UNKNOWN_ROUTE = '/__grader_unknown_route__';

export const unknownRouteGrader: Grader = {
  label: 'Unknown Routes Return 404',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, UNKNOWN_ROUTE), { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 404);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'application/json');
    if (failure) return failure;

    const json = await parseJsonResponse(response.value, 'Unknown route JSON parsing failed');
    if (!json.ok) return json.result;

    if (!errorSchema.safeParse(json.value).success) {
      return {
        status: 'fail',
        message: 'Unknown route JSON did not contain non-empty message and id fields',
        details: JSON.stringify(json.value)
      };
    }

    return { status: 'pass', message: 'Unknown route returned 404' };
  }
};
