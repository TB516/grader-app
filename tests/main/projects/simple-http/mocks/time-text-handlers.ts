import { http } from 'msw';
import {
  badContentTypeTimeResolver,
  badTimeResolver,
  goodTimeResolver,
  httpErrorTimeResolver,
  networkErrorTimeResolver,
  timeParseFailureTimeResolver
} from './time-resolvers';

export const goodTimeTextUrl = 'https://good.simple-http.com/time';
export const goodTimeTextHandler = http.get(goodTimeTextUrl, goodTimeResolver);

export const httpErrorTimeTextUrl = 'https://httperror.simple-http.com/time';
export const httpErrorTimeTexHandler = http.get(httpErrorTimeTextUrl, httpErrorTimeResolver);

export const timeParseFailureTimeTextUrl = 'https://timeParseFailure.simple-http.com/time';
export const timeParseFailureTimeTextHandler = http.get(timeParseFailureTimeTextUrl, timeParseFailureTimeResolver);

export const badContentTypeTimeTextUrl = 'https://badContentType.simple-http.com/time';
export const badContentTypeTimeTexHandler = http.get(badContentTypeTimeTextUrl, badContentTypeTimeResolver);

export const badTimeTextUrl = 'https://bad.simple-http.com/time';
export const badTimeTextHandler = http.get(badTimeTextUrl, badTimeResolver);

export const networkErrorTimeTextUrl = 'https://neterror.simple-http.com';
export const networkErrorTimeTextHandler = http.get(networkErrorTimeTextUrl, networkErrorTimeResolver);
