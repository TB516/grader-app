import { t } from 'try';
import type { GraderResult } from '../../../../shared/types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';

export const genericTextRunner = async (
  url: string,
  expected: string,
  isEqual: (expected: string, actual: string) => boolean
): Promise<GraderResult> => {
  const response = await t(fetch, url);
  if (!response.ok) return fetchErrorResult(response.error);

  let failure = httpStatusCheck(response.value, 200);
  if (failure) return failure;

  failure = contentTypeCheck(response.value, 'text/plain');
  if (failure) return failure;

  const text = await t(response.value.text);
  if (!text.ok) return { status: 'error', message: 'Text parsing failed', details: JSON.stringify(text.error) };

  if (!isEqual(expected, text.value))
    return {
      status: 'fail',
      message: `Expected '${expected}', but found '${text.value}'`,
      details: JSON.stringify(text.error)
    };

  return {
    status: 'pass',
    message: 'Page returned HTML',
    details: JSON.stringify(response)
  };
};
