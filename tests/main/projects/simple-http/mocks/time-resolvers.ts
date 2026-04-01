import { HttpResponse } from 'msw';
import { WIGGLE_ROOM } from '../../../../../src/main/projects/simple-http/graders/time-text';

const getTime = (d: Date) => {
  return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
};

export const goodTimeResolver = () => {
  return HttpResponse.text(getTime(new Date()));
};

export const httpErrorTimeResolver = () => {
  return new HttpResponse({ status: 400 });
};

export const timeParseFailureTimeResolver = () => {
  return HttpResponse.text(``);
};

export const badContentTypeTimeResolver = () => {
  return HttpResponse.html();
};

export const badTimeResolver = () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + WIGGLE_ROOM * 2);
  return HttpResponse.text(getTime(date));
};

export const networkErrorTimeResolver = () => {
  return HttpResponse.error();
};
