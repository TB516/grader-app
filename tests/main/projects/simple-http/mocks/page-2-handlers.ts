import { http } from 'msw';
import {
  badGenericHtmlResolver,
  goodGenericHtmlResolver,
  httpErrorGenericHtmlResolver,
  networkErrorGenericHtmlResolver
} from './generic-html-resolvers';

export const goodPage2Url = 'https://good.simple-http.com/page2';
export const goodPage2Handler = http.get(goodPage2Url, goodGenericHtmlResolver);

export const badPage2Url = 'https://bad.simple-http.com/page2';
export const badPage2Handler = http.get(badPage2Url, badGenericHtmlResolver);

export const httpErrorPage2Url = 'https://httperror.simple-http.com/page2';
export const httpErrorPage2Handler = http.get(httpErrorPage2Url, httpErrorGenericHtmlResolver);

export const networkErrorPage2Url = 'https://neterror.simple-http.com/page2';
export const networkErrorPage2Handler = http.get(httpErrorPage2Url, networkErrorGenericHtmlResolver);
