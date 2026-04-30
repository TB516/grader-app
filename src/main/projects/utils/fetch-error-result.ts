import type { GraderResult } from '../../../shared/types';
import { errorDetails } from './details';

export const fetchErrorResult = (e: unknown): GraderResult => {
  return {
    status: 'error',
    message: 'A fetch error occurred',
    details: errorDetails(e)
  };
};
