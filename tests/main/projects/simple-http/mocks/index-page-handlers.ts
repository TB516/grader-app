import { http } from 'msw';
import {
  badGenericHtmlResolver,
  goodGenericHtmlResolver,
  httpErrorGenericHtmlResolver,
  networkErrorGenericHtmlResolver
} from './generic-html-resolvers';

export const goodIndexPageUrl = 'https://good.simple-http.com';
export const goodIndexPageHandler = http.get(goodIndexPageUrl, goodGenericHtmlResolver);

export const badIndexPageUrl = 'https://bad.simple-http.com';
export const badIndexPageHandler = http.get(badIndexPageUrl, badGenericHtmlResolver);

export const httpErrorIndexPageUrl = 'https://httperror.simple-http.com';
export const httpErrorIndexPageHandler = http.get(httpErrorIndexPageUrl, httpErrorGenericHtmlResolver);

export const networkErrorIndexPageUrl = 'https://neterror.simple-http.com';
export const networkErrorIndexPageHandler = http.get(networkErrorIndexPageUrl, networkErrorGenericHtmlResolver);
