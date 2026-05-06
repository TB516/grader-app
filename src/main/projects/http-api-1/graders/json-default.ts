import { t } from 'try';
import type { Grader } from '../../../types';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { apiExpectations, checkJsonResponse, fetchWithAccept } from './response-shape';

export const jsonDefaultGrader: Grader = {
  label: 'API Defaults To JSON Without Accept Header',
  run: async (url) => {
    for (const expectation of apiExpectations) {
      const response = await t(async () => await fetchWithAccept(url, expectation.path));
      if (!response.ok) return fetchErrorResult(response.error);

      const failure = await checkJsonResponse(response.value, expectation);
      if (failure) return failure;
    }

    return { status: 'pass', message: 'API defaulted to JSON for every endpoint' };
  }
};
