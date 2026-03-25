import { Grader } from '../../../types';
import { GraderRunResult } from '../../../../shared/types';

export const indexPageGrader: Grader = {
  label: 'Index Page Returns HTML',
  run: async (url: string): Promise<GraderRunResult> => {
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
        status: 'error',
        message: 'Content-Type header was not "text/html"',
        details: JSON.stringify(response)
      };
    }

    return {
      status: 'pass',
      message: 'Index page returned HTML',
      details: JSON.stringify(response)
    };
  }
};
