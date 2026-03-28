import { http, HttpResponse } from 'msw';

export const goodIndexPageUrl = 'https://good.project.com';
export const goodIndexPageHandler = http.get(goodIndexPageUrl, () => {
  return HttpResponse.html();
});

export const badIndexPageUrl = 'https://bad.project.com';
export const badIndexPageHandler = http.get(badIndexPageUrl, () => {
  return HttpResponse.json();
});

export const httpErrorIndexPageUrl = 'https://httperror.project.com';
export const httpErrorIndexPageHandler = http.get(httpErrorIndexPageUrl, () => {
  return new HttpResponse(null, { status: 404 });
});

export const networkErrorIndexPageUrl = 'https://neterror.project.com';
export const networkErrorIndexPageHandler = http.get(httpErrorIndexPageUrl, () => {
  return HttpResponse.error();
});
