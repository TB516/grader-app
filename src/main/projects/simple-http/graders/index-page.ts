import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { errorDetails, responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';

export const indexPageGrader: Grader = {
  label: 'Index Page Returns HTML',
  run: async (url) => {
    const response = await t(fetch, new URL(url));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/html');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'Text parsing failed', details: errorDetails(text.error) };
    if (!text.value.trim()) return { status: 'fail', message: 'HTML body was empty', details: responseDetails(response.value) };

    return { status: 'pass', message: 'Index Page Returned HTML', details: responseDetails(response.value) };
  }
};
