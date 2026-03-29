import type { GraderResult } from '../../../../shared/types';

export const genericHtmlRunner = async (url: string): Promise<GraderResult> => {
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
      message: 'Page returned HTML',
      details: JSON.stringify(response)
    };
  } catch (e) {
    return {
      status: 'error',
      message: 'A network error occurred',
      details: JSON.stringify(e)
    };
  }
};
