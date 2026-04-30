import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

const EXPECTED_MESSAGE = 'Hello World';

export const helloJsonGrader: Grader = {
  label: 'Hello JSON Endpoint Returns {"message":"Hello World"}',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, '/helloJSON'));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'application/json');
    if (failure) return failure;

    const json = await t(async () => await response.value.json());
    if (!json.ok) return { status: 'fail', message: 'JSON parsing failed', details: responseDetails(response.value) };

    if (typeof json.value !== 'object' || json.value === null || json.value.message !== EXPECTED_MESSAGE || Object.keys(json.value).length !== 1) {
      return {
        status: 'fail',
        message: `JSON was not {"message":"${EXPECTED_MESSAGE}"}`,
        details: JSON.stringify(json.value)
      };
    }

    return {
      status: 'pass',
      message: `JSON was {"message":"${EXPECTED_MESSAGE}"}`,
      details: JSON.stringify(json.value)
    };
  }
};
