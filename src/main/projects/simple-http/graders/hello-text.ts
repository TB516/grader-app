import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';

const expectedText = 'Hello World';

export const helloTextGrader: Grader = {
  label: 'Hello Endpoint Returns "Hello World"',
  run: async (url) => {
    const response = await t(fetch, url);
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/plain');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'Text parsing failed', details: JSON.stringify(text.error) };

    if (text.value === expectedText) return { status: 'fail', message: `Text was not '${expectedText}'`, details: JSON.stringify(response) };

    return {
      status: 'pass',
      message: `Text was '${expectedText}'`,
      details: JSON.stringify(response)
    };
  }
};
