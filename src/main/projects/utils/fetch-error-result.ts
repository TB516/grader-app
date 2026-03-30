import type { GraderResult } from '../../../shared/types';

export const fetchErrorResult = (e: unknown): GraderResult => {
  return {
    status: 'error',
    message: 'A fetch error occurred',
    details: JSON.stringify(e)
  };
};
