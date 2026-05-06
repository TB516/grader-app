import { http, HttpResponse } from 'msw';

export const goodStreamingMediaBaseUrl = 'https://good.streaming-media.com';
export const badStreamingMediaBaseUrl = 'https://bad.streaming-media.com';
export const emptyStreamingMediaBaseUrl = 'https://empty.streaming-media.com';
export const httpErrorStreamingMediaBaseUrl = 'https://httperror.streaming-media.com';
export const networkErrorStreamingMediaBaseUrl = 'https://neterror.streaming-media.com';

const pagePaths = ['', '/page2', '/page3'];

export const goodPageHandlers = pagePaths.map((path) => {
  return http.get(`${goodStreamingMediaBaseUrl}${path}`, () => HttpResponse.html('<html><body><h1>Streaming Media</h1></body></html>'));
});

export const badPageHandlers = pagePaths.map((path) => {
  return http.get(`${badStreamingMediaBaseUrl}${path}`, () => HttpResponse.json({ message: 'not html' }));
});

export const emptyPageHandlers = pagePaths.map((path) => {
  return http.get(`${emptyStreamingMediaBaseUrl}${path}`, () => HttpResponse.html(''));
});

export const httpErrorPageHandlers = pagePaths.map((path) => {
  return http.get(`${httpErrorStreamingMediaBaseUrl}${path}`, () => new HttpResponse(null, { status: 404 }));
});

export const networkErrorPageHandlers = pagePaths.map((path) => {
  return http.get(`${networkErrorStreamingMediaBaseUrl}${path}`, () => HttpResponse.error());
});
