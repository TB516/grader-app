import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { errorDetails, responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

export const styleCssGrader: Grader = {
  label: 'Style CSS Returns text/css',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, '/style.css'));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/css');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'CSS text parsing failed', details: errorDetails(text.error) };
    if (!text.value.trim()) return { status: 'fail', message: 'CSS body was empty', details: responseDetails(response.value) };

    return { status: 'pass', message: 'Style CSS returned text/css', details: responseDetails(response.value) };
  }
};
