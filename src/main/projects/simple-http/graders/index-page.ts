import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';

export const indexPageGrader: Grader = {
  label: 'Index Page Returns HTML',
  run: async (url) => {
    const response = await t(fetch, url);
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/html');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'Text parsing failed', details: JSON.stringify(text.error) };

    return { status: 'pass', message: 'Index Page Returned HTML', details: JSON.stringify(response.value) };
  }
};
