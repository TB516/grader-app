import { t } from 'try';
import type { Grader } from '../../../types';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { hasErrorShape, parseJsonResponse } from './json-shape';

const UNKNOWN_ROUTE = '/__grader_unknown_route__';

export const unknownRouteGrader: Grader = {
  label: 'Unknown Routes Return 404',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, UNKNOWN_ROUTE));
    if (!response.ok) return fetchErrorResult(response.error);

    const failure = httpStatusCheck(response.value, 404);
    if (failure) return failure;

    if (response.value.headers.get('Content-Type')?.includes('application/json')) {
      const json = await parseJsonResponse(response.value, 'Unknown route JSON parsing failed');
      if (!json.ok) return json.result;

      if (!hasErrorShape(json.value)) {
        return {
          status: 'fail',
          message: 'Unknown route JSON did not contain non-empty message and id fields',
          details: JSON.stringify(json.value)
        };
      }
    }

    return { status: 'pass', message: 'Unknown route returned 404' };
  }
};
