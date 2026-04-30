import type { GraderResult } from '../../../shared/types';
import { responseDetails } from './details';

export const httpStatusCheck = (response: Response, code: number): GraderResult | null => {
  if (response.status !== code) {
    return {
      status: 'fail',
      message: `HTTP response status was not "${code}"`,
      details: responseDetails(response)
    };
  }

  return null;
};
