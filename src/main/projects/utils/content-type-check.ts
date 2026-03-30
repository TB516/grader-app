import type { GraderResult } from '../../../shared/types';

export const contentTypeCheck = (response: Response, contentType: string): GraderResult | null => {
  if (response.headers.get('Content-Type') !== contentType) {
    return {
      status: 'fail',
      message: `Content-Type header was not "${contentType}"`,
      details: JSON.stringify(response)
    };
  }

  return null;
};
