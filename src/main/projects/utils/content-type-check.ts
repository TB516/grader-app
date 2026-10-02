import type { GraderResult } from '../../../shared/types';
import { responseDetails } from './details';

export const contentTypeCheck = (response: Response, contentType: string): GraderResult | null => {
  const actualContentType = response.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (actualContentType !== contentType) {
    return {
      status: 'fail',
      message: `Content-Type header was not "${contentType}"`,
      details: responseDetails(response)
    };
  }

  return null;
};
