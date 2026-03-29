import { setupServer } from 'msw/node';
import { badIndexPageHandler, goodIndexPageHandler, httpErrorIndexPageHandler, networkErrorIndexPageHandler } from './index-page-handlers';
import { badPage2Handler, goodPage2Handler, httpErrorPage2Handler, networkErrorPage2Handler } from './page-2-handlers';

export const server = setupServer(
  ...[
    goodIndexPageHandler,
    badIndexPageHandler,
    httpErrorIndexPageHandler,
    networkErrorIndexPageHandler,
    goodPage2Handler,
    badPage2Handler,
    httpErrorPage2Handler,
    networkErrorPage2Handler
  ]
);
