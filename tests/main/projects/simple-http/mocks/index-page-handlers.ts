import { http, HttpResponse } from 'msw';

export const goodIndexPageUrl = 'https://good.simple-http.com';
export const goodIndexPageHandler = http.get(goodIndexPageUrl, () => {
  return HttpResponse.html();
});

export const badIndexPageUrl = 'https://bad.simple-http.com';
export const badIndexPageHandler = http.get(badIndexPageUrl, () => {
  return HttpResponse.json();
});

export const httpErrorIndexPageUrl = 'https://httperror.simple-http.com';
export const httpErrorIndexPageHandler = http.get(httpErrorIndexPageUrl, () => {
  return new HttpResponse(null, { status: 404 });
});

export const networkErrorIndexPageUrl = 'https://neterror.simple-http.com';
export const networkErrorIndexPageHandler = http.get(httpErrorIndexPageUrl, () => {
  return HttpResponse.error();
});
