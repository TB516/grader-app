import { t } from 'try';
import type { Grader } from '../../../types';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { apiExpectations, checkXmlResponse, fetchWithAccept } from './response-shape';

export const xmlEndpointsGrader: Grader = {
  label: 'API Returns XML For text/xml Accept Header',
  run: async (url) => {
    for (const expectation of apiExpectations) {
      const response = await t(async () => await fetchWithAccept(url, expectation.path, 'text/xml'));
      if (!response.ok) return fetchErrorResult(response.error);

      const failure = await checkXmlResponse(response.value, expectation);
      if (failure) return failure;
    }

    return { status: 'pass', message: 'API returned XML for every endpoint with text/xml Accept header' };
  }
};
