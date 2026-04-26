import { http, HttpResponse } from 'msw';
import { WIGGLE_ROOM } from '../../../../../src/main/projects/simple-http/graders/time-text';

const getTime = (d: Date) => {
  return `${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
};

export const goodTimeTextBaseUrl = 'https://good.simple-http.com';
export const goodTimeTextHandler = http.get(`${goodTimeTextBaseUrl}/time`, () => {
  return HttpResponse.text(getTime(new Date()));
});

export const httpErrorTimeTextBaseUrl = 'https://httperror.simple-http.com';
export const httpErrorTimeTexHandler = http.get(`${httpErrorTimeTextBaseUrl}/time`, () => {
  return new HttpResponse(null, { status: 400 });
});

export const timeParseFailureTimeTextBaseUrl = 'https://parsefailure.simple-http.com';
export const timeParseFailureTimeTextHandler = http.get(`${timeParseFailureTimeTextBaseUrl}/time`, () => {
  return HttpResponse.text(``);
});

export const badContentTypeTimeTextBaseUrl = 'https://badContentType.simple-http.com';
export const badContentTypeTimeTexHandler = http.get(`${badContentTypeTimeTextBaseUrl}/time`, () => {
  return HttpResponse.html();
});

export const badTimeTextBaseUrl = 'https://bad.simple-http.com';
export const badTimeTextHandler = http.get(`${badTimeTextBaseUrl}/time`, () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + WIGGLE_ROOM * 2);
  return HttpResponse.text(getTime(date));
});

export const networkErrorTimeTextBaseUrl = 'https://neterror.simple-http.com';
export const networkErrorTimeTextHandler = http.get(`${networkErrorTimeTextBaseUrl}/time`, () => {
  return HttpResponse.error();
});
