import { setupServer } from 'msw/node';
import { goodIndexPageHandler, badIndexPageHandler, httpErrorIndexPageHandler, networkErrorIndexPageHandler } from './index-page-handlers';

export const server = setupServer(...[goodIndexPageHandler, badIndexPageHandler, httpErrorIndexPageHandler, networkErrorIndexPageHandler]);
