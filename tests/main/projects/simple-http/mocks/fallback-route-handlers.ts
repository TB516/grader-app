import { http, HttpResponse } from 'msw';

const INDEX_HTML = '<html><body><h1>Index</h1></body></html>';
const FALLBACK_PATH = '/__grader_unknown_route__';

export const goodFallbackRouteUrl = 'https://good.simple-http.com';
export const goodFallbackRouteUnknownHandler = http.get(`${goodFallbackRouteUrl}${FALLBACK_PATH}`, () => {
  return HttpResponse.html(INDEX_HTML);
});

export const badFallbackRouteUrl = 'https://bad.simple-http.com';
export const badFallbackRouteUnknownHandler = http.get(`${badFallbackRouteUrl}${FALLBACK_PATH}`, () => {
  return HttpResponse.html('');
});

export const badContentTypeFallbackRouteUrl = 'https://badContentType.simple-http.com';
export const badContentTypeFallbackRouteUnknownHandler = http.get(`${badContentTypeFallbackRouteUrl}${FALLBACK_PATH}`, () => {
  return HttpResponse.text(INDEX_HTML);
});

export const httpErrorFallbackRouteUrl = 'https://httperror.simple-http.com';
export const httpErrorFallbackRouteUnknownHandler = http.get(`${httpErrorFallbackRouteUrl}${FALLBACK_PATH}`, () => {
  return new HttpResponse(null, { status: 404 });
});

export const networkErrorFallbackRouteUrl = 'https://neterror.simple-http.com';
export const networkErrorFallbackRouteUnknownHandler = http.get(`${networkErrorFallbackRouteUrl}${FALLBACK_PATH}`, () => {
  return HttpResponse.error();
});
