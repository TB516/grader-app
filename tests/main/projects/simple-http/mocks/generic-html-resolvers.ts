import { HttpResponse } from 'msw';

export const goodGenericHtmlResolver = () => {
  return HttpResponse.html('<html><body><h1>Header</h1></body></html>');
};

export const badGenericHtmlResolver = () => {
  return HttpResponse.json();
};

export const httpErrorGenericHtmlResolver = () => {
  return new HttpResponse(null, { status: 404 });
};

export const networkErrorGenericHtmlResolver = () => {
  return HttpResponse.error();
};
