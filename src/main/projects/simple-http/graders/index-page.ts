import type { GraderRunResult } from '../../../../shared/types';
import type { Grader } from '../../../types';

export const indexPageGrader: Grader = {
  label: 'Index Page Returns HTML',
  run: async (url: string): Promise<GraderRunResult> => {
    try {
      const response = await fetch(url);

      if (response.status !== 200) {
        return {
          status: 'error',
          message: 'HTTP response status was not 200',
          details: JSON.stringify(response)
        };
      }

      if (response.headers.get('Content-Type') !== 'text/html') {
        return {
          status: 'fail',
          message: 'Content-Type header was not "text/html"',
          details: JSON.stringify(response)
        };
      }

      return {
        status: 'pass',
        message: 'Index page returned HTML',
        details: JSON.stringify(response)
      };
    } catch (e) {
      return {
        status: 'error',
        message: 'A network error occurred',
        details: JSON.stringify(e)
      };
    }
  }
};
