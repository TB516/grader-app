import type { GraderResult } from '../../../shared/types';
import { responseDetails } from './details';

export const contentTypeCheck = (response: Response, contentType: string): GraderResult | null => {
  if (!response.headers.get('Content-Type')?.includes(contentType)) {
    return {
      status: 'fail',
      message: `Content-Type header was not "${contentType}"`,
      details: responseDetails(response)
    };
  }

  return null;
};
