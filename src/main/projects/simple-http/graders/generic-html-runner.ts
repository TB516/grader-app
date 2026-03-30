import type { GraderResult } from '../../../../shared/types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';

export const genericHtmlRunner = async (url: string): Promise<GraderResult> => {
  try {
    const response = await fetch(url);

    let failure = httpStatusCheck(response, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response, 'text/html');
    if (failure) return failure;

    return {
      status: 'pass',
      message: 'Page returned HTML',
      details: JSON.stringify(response)
    };
  } catch (e) {
    return fetchErrorResult(e);
  }
};
