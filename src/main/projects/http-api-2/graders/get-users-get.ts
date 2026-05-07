import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { extractUsersPayload, parseJsonResponse } from './json-shape';

export const getUsersGetGrader: Grader = {
  label: '/getUsers GET Returns Users JSON',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, '/getUsers'));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'application/json');
    if (failure) return failure;

    const json = await parseJsonResponse(response.value, '/getUsers JSON parsing failed');
    if (!json.ok) return json.result;

    const usersPayload = extractUsersPayload(json.value);
    if (!usersPayload) {
      return {
        status: 'fail',
        message: '/getUsers JSON was not an object or did not contain a usable users object',
        details: JSON.stringify(json.value)
      };
    }

    return { status: 'pass', message: '/getUsers returned users JSON', details: responseDetails(response.value) };
  }
};
