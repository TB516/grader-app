import { t } from 'try';
import type { Grader } from '../../../types';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { apiExpectations, checkJsonResponse, fetchWithAccept } from './response-shape';

export const jsonEndpointsGrader: Grader = {
  label: 'API Returns JSON For application/json Accept Header',
  run: async (url) => {
    for (const expectation of apiExpectations) {
      const response = await t(async () => await fetchWithAccept(url, expectation.path, 'application/json'));
      if (!response.ok) return fetchErrorResult(response.error);

      const failure = await checkJsonResponse(response.value, expectation);
      if (failure) return failure;
    }

    return { status: 'pass', message: 'API returned JSON for every endpoint with application/json Accept header' };
  }
};
