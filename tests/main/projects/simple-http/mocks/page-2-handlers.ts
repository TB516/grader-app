import { http } from 'msw';
import {
  badGenericHtmlResolver,
  goodGenericHtmlResolver,
  httpErrorGenericHtmlResolver,
  networkErrorGenericHtmlResolver
} from './generic-html-resolvers';

export const goodPage2BaseUrl = 'https://good.simple-http.com';
export const goodPage2Handler = http.get(`${goodPage2BaseUrl}/page2`, goodGenericHtmlResolver);

export const badPage2BaseUrl = 'https://bad.simple-http.com';
export const badPage2Handler = http.get(`${badPage2BaseUrl}/page2`, badGenericHtmlResolver);

export const httpErrorPage2BaseUrl = 'https://httperror.simple-http.com';
export const httpErrorPage2Handler = http.get(`${httpErrorPage2BaseUrl}/page2`, httpErrorGenericHtmlResolver);

export const networkErrorPage2BaseUrl = 'https://neterror.simple-http.com';
export const networkErrorPage2Handler = http.get(`${networkErrorPage2BaseUrl}/page2`, networkErrorGenericHtmlResolver);
