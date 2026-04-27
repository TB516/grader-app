import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

const UNKNOWN_ROUTE = '/__grader_unknown_route__';

export const fallbackRouteGrader: Grader = {
  label: 'Unknown Routes Match Index Page',
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, UNKNOWN_ROUTE));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/html');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'Fallback text parsing failed', details: JSON.stringify(text.error) };

    if (!text.value.trim()) return { status: 'fail', message: 'HTML body was empty', details: JSON.stringify(response.value) };

    return { status: 'pass', message: 'Unknown route returned HTML', details: JSON.stringify(response.value) };
  }
};
