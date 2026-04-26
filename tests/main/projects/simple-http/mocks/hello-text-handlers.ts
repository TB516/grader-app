import { http, HttpResponse } from 'msw';

export const goodHelloTextUrl = 'https://good.simple-http.com';
export const goodHelloTextHandler = http.get(`${goodHelloTextUrl}/hello`, () => {
  return HttpResponse.text('Hello World');
});

export const badHelloTextUrl = 'https://bad.simple-http.com';
export const badHelloTextHandler = http.get(`${badHelloTextUrl}/hello`, () => {
  return HttpResponse.text('Hello');
});

export const badContentTypeHelloTextUrl = 'https://badContentType.simple-http.com';
export const badContentTypeHelloTextHandler = http.get(`${badContentTypeHelloTextUrl}/hello`, () => {
  return HttpResponse.json({ message: 'Hello World' });
});

export const httpErrorHelloTextUrl = 'https://httperror.simple-http.com';
export const httpErrorHelloTextHandler = http.get(`${httpErrorHelloTextUrl}/hello`, () => {
  return new HttpResponse(null, { status: 400 });
});

export const networkErrorHelloTextUrl = 'https://neterror.simple-http.com';
export const networkErrorHelloTextHandler = http.get(`${networkErrorHelloTextUrl}/hello`, () => {
  return HttpResponse.error();
});
