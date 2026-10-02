import { setupServer } from 'msw/node';
import {
  badHomePageContentTypeHandler,
  badJsonContentTypeHandlers,
  badJsonDefaultHandlers,
  badJsonStatusHandlers,
  badStyleCssContentTypeHandlers,
  badXmlContentTypeHandlers,
  badXmlStatusHandlers,
  emptyHomePageHandler,
  emptyStyleCssHandlers,
  goodHttpApi1Handlers,
  goodHttpApi1InternalErrorHandlers,
  httpErrorHomePageHandler,
  httpErrorStyleCssHandlers,
  invalidJsonHandlers,
  missingJsonMessageHandlers,
  missingXmlMessageHandlers,
  networkErrorApiHandlers,
  networkErrorHomePageHandler,
  networkErrorStyleCssHandlers,
  wrongJsonIdHandlers,
  wrongXmlIdHandlers
} from './http-api-1-handlers';

export const server = setupServer(
  ...[
    ...goodHttpApi1Handlers,
    ...goodHttpApi1InternalErrorHandlers,
    emptyHomePageHandler,
    badHomePageContentTypeHandler,
    httpErrorHomePageHandler,
    networkErrorHomePageHandler,
    ...emptyStyleCssHandlers,
    ...badStyleCssContentTypeHandlers,
    ...httpErrorStyleCssHandlers,
    ...networkErrorStyleCssHandlers,
    ...badJsonDefaultHandlers,
    ...badJsonStatusHandlers,
    ...badJsonContentTypeHandlers,
    ...invalidJsonHandlers,
    ...missingJsonMessageHandlers,
    ...wrongJsonIdHandlers,
    ...badXmlStatusHandlers,
    ...badXmlContentTypeHandlers,
    ...missingXmlMessageHandlers,
    ...wrongXmlIdHandlers,
    ...networkErrorApiHandlers
  ]
);
