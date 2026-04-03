import { http, HttpResponse } from 'msw';
import { WIGGLE_ROOM } from '../../../../../src/main/projects/simple-http/graders/time-text';

const getTime = (d: Date) => {
  return `${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
};

export const goodTimeTextUrl = 'https://good.simple-http.com/time';
export const goodTimeTextHandler = http.get(goodTimeTextUrl, () => {
  return HttpResponse.text(getTime(new Date()));
});

export const httpErrorTimeTextUrl = 'https://httperror.simple-http.com/time';
export const httpErrorTimeTexHandler = http.get(httpErrorTimeTextUrl, () => {
  return new HttpResponse(null, { status: 400 });
});

export const timeParseFailureTimeTextUrl = 'https://timeParseFailure.simple-http.com/time';
export const timeParseFailureTimeTextHandler = http.get(timeParseFailureTimeTextUrl, () => {
  return HttpResponse.text(``);
});

export const badContentTypeTimeTextUrl = 'https://badContentType.simple-http.com/time';
export const badContentTypeTimeTexHandler = http.get(badContentTypeTimeTextUrl, () => {
  return HttpResponse.html();
});

export const badTimeTextUrl = 'https://bad.simple-http.com/time';
export const badTimeTextHandler = http.get(badTimeTextUrl, () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + WIGGLE_ROOM * 2);
  return HttpResponse.text(getTime(date));
});

export const networkErrorTimeTextUrl = 'https://neterror.simple-http.com';
export const networkErrorTimeTextHandler = http.get(networkErrorTimeTextUrl, () => {
  return HttpResponse.error();
});
