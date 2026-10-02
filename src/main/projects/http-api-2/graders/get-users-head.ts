import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { errorDetails, responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

export const getUsersHeadGrader: Grader = {
  label: '/getUsers HEAD Returns 200 Without Body',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, '/getUsers'), { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'application/json');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'HEAD body parsing failed', details: errorDetails(text.error) };
    if (text.value.length > 0) return { status: 'fail', message: 'HEAD response had a body', details: text.value };

    return { status: 'pass', message: '/getUsers HEAD returned 200 without a body', details: responseDetails(response.value) };
  }
};
