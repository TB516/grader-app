import { t } from 'try';
import type { GraderResult } from '../../../../shared/types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';

export const genericHtmlRunner = async (url: string): Promise<GraderResult> => {
  const [ok, error, response] = await t(fetch, url);

  if (!ok) return fetchErrorResult(error);

  let failure = httpStatusCheck(response, 200);
  if (failure) return failure;

  failure = contentTypeCheck(response, 'text/html');
  if (failure) return failure;

  return {
    status: 'pass',
    message: 'Page returned HTML',
    details: JSON.stringify(response)
  };
};
