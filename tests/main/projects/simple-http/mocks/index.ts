import { setupServer } from 'msw/node';
import {
  badContentTypeDankmemesImageHandler,
  badDankmemesImageHandler,
  emptyDankmemesImageHandler,
  goodDankmemesImageHandler,
  httpErrorDankmemesImageHandler,
  networkErrorDankmemesImageHandler
} from './dankmemes-image-handlers';
import {
  badContentTypeFallbackRouteUnknownHandler,
  badFallbackRouteUnknownHandler,
  goodFallbackRouteUnknownHandler,
  httpErrorFallbackRouteUnknownHandler,
  networkErrorFallbackRouteUnknownHandler
} from './fallback-route-handlers';
import {
  badContentTypeHelloJsonHandler,
  badHelloJsonHandler,
  goodHelloJsonHandler,
  httpErrorHelloJsonHandler,
  invalidJsonHelloJsonHandler,
  networkErrorHelloJsonHandler
} from './hello-json-handlers';
import {
  badContentTypeHelloTextHandler,
  badHelloTextHandler,
  goodHelloTextHandler,
  httpErrorHelloTextHandler,
  networkErrorHelloTextHandler
} from './hello-text-handlers';
import { badIndexPageHandler, goodIndexPageHandler, httpErrorIndexPageHandler, networkErrorIndexPageHandler } from './index-page-handlers';
import { badPage2Handler, goodPage2Handler, httpErrorPage2Handler, networkErrorPage2Handler } from './page-2-handlers';
import {
  badContentTypeTimeJsonHandler,
  badShapeTimeJsonHandler,
  badTimeJsonHandler,
  goodTimeJsonHandler,
  httpErrorTimeJsonHandler,
  invalidJsonTimeJsonHandler,
  networkErrorTimeJsonHandler,
  timeParseFailureTimeJsonHandler
} from './time-json-handlers';
import {
  badContentTypeTimeTexHandler,
  badTimeTextHandler,
  goodTimeTextHandler,
  httpErrorTimeTexHandler,
  networkErrorTimeTextHandler,
  timeParseFailureTimeTextHandler
} from './time-text-handlers';

export const server = setupServer(
  ...[
    goodIndexPageHandler,
    badIndexPageHandler,
    httpErrorIndexPageHandler,
    networkErrorIndexPageHandler,
    goodPage2Handler,
    badPage2Handler,
    httpErrorPage2Handler,
    networkErrorPage2Handler,
    goodHelloTextHandler,
    badHelloTextHandler,
    badContentTypeHelloTextHandler,
    httpErrorHelloTextHandler,
    networkErrorHelloTextHandler,
    goodTimeTextHandler,
    httpErrorTimeTexHandler,
    timeParseFailureTimeTextHandler,
    badContentTypeTimeTexHandler,
    badTimeTextHandler,
    networkErrorTimeTextHandler,
    goodHelloJsonHandler,
    badHelloJsonHandler,
    invalidJsonHelloJsonHandler,
    badContentTypeHelloJsonHandler,
    httpErrorHelloJsonHandler,
    networkErrorHelloJsonHandler,
    goodTimeJsonHandler,
    badTimeJsonHandler,
    badShapeTimeJsonHandler,
    timeParseFailureTimeJsonHandler,
    invalidJsonTimeJsonHandler,
    badContentTypeTimeJsonHandler,
    httpErrorTimeJsonHandler,
    networkErrorTimeJsonHandler,
    goodDankmemesImageHandler,
    badDankmemesImageHandler,
    emptyDankmemesImageHandler,
    badContentTypeDankmemesImageHandler,
    httpErrorDankmemesImageHandler,
    networkErrorDankmemesImageHandler,
    goodFallbackRouteUnknownHandler,
    badFallbackRouteUnknownHandler,
    badContentTypeFallbackRouteUnknownHandler,
    httpErrorFallbackRouteUnknownHandler,
    networkErrorFallbackRouteUnknownHandler
  ]
);
