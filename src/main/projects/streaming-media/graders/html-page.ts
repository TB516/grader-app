import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

type HtmlPageGraderOptions = {
  label: string;
  path: string;
  passMessage: string;
};

export const htmlPageGrader = ({ label, path, passMessage }: HtmlPageGraderOptions): Grader => ({
  label,
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, path));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/html');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'Text parsing failed', details: JSON.stringify(text.error) };
    if (!text.value.trim()) return { status: 'fail', message: 'HTML body was empty', details: JSON.stringify(response.value) };

    return { status: 'pass', message: passMessage, details: JSON.stringify(response.value) };
  }
});
