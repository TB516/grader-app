import { http, HttpResponse } from 'msw';

export const goodHelloJsonUrl = 'https://good.simple-http.com';
export const goodHelloJsonHandler = http.get(`${goodHelloJsonUrl}/helloJSON`, () => {
  return HttpResponse.json({ message: 'Hello World' });
});

export const badHelloJsonUrl = 'https://bad.simple-http.com';
export const badHelloJsonHandler = http.get(`${badHelloJsonUrl}/helloJSON`, () => {
  return HttpResponse.json({ message: 'Hello' });
});

export const invalidJsonHelloJsonUrl = 'https://invalidJson.simple-http.com';
export const invalidJsonHelloJsonHandler = http.get(`${invalidJsonHelloJsonUrl}/helloJSON`, () => {
  return new HttpResponse('{', {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

export const badContentTypeHelloJsonUrl = 'https://badContentType.simple-http.com';
export const badContentTypeHelloJsonHandler = http.get(`${badContentTypeHelloJsonUrl}/helloJSON`, () => {
  return HttpResponse.text(JSON.stringify({ message: 'Hello World' }));
});

export const httpErrorHelloJsonUrl = 'https://httperror.simple-http.com';
export const httpErrorHelloJsonHandler = http.get(`${httpErrorHelloJsonUrl}/helloJSON`, () => {
  return new HttpResponse(null, { status: 400 });
});

export const networkErrorHelloJsonUrl = 'https://neterror.simple-http.com';
export const networkErrorHelloJsonHandler = http.get(`${networkErrorHelloJsonUrl}/helloJSON`, () => {
  return HttpResponse.error();
});
