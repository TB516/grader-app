import type { GraderResult } from '../../../shared/types';

export const httpStatusCheck = (response: Response, code: number): GraderResult | null => {
  if (response.status !== code) {
    return {
      status: 'error',
      message: `HTTP response status was not "${code}"`,
      details: JSON.stringify(response)
    };
  }

  return null;
};
