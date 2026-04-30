import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { errorDetails, responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

export const page2Grader: Grader = {
  label: 'Page 2 Returns HTML',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, '/page2'));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/html');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'Text parsing failed', details: errorDetails(text.error) };
    if (!text.value.trim()) return { status: 'fail', message: 'HTML body was empty', details: responseDetails(response.value) };

    return { status: 'pass', message: 'Page 2 Returned HTML', details: responseDetails(response.value) };
  }
};
