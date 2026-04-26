import { http, HttpResponse } from 'msw';
import { WIGGLE_ROOM } from '../../../../../src/main/projects/simple-http/graders/time-text';

const getTime = (d: Date) => {
  return `${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
};

export const goodTimeJsonUrl = 'https://good.simple-http.com';
export const goodTimeJsonHandler = http.get(`${goodTimeJsonUrl}/timeJSON`, () => {
  return HttpResponse.json({ time: getTime(new Date()) });
});

export const badTimeJsonUrl = 'https://bad.simple-http.com';
export const badTimeJsonHandler = http.get(`${badTimeJsonUrl}/timeJSON`, () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + WIGGLE_ROOM * 2);
  return HttpResponse.json({ time: getTime(date) });
});

export const badShapeTimeJsonUrl = 'https://badShape.simple-http.com';
export const badShapeTimeJsonHandler = http.get(`${badShapeTimeJsonUrl}/timeJSON`, () => {
  return HttpResponse.json({ message: 'Hello World' });
});

export const timeParseFailureTimeJsonUrl = 'https://timeParseFailure.simple-http.com';
export const timeParseFailureTimeJsonHandler = http.get(`${timeParseFailureTimeJsonUrl}/timeJSON`, () => {
  return HttpResponse.json({ time: '' });
});

export const invalidJsonTimeJsonUrl = 'https://invalidJson.simple-http.com';
export const invalidJsonTimeJsonHandler = http.get(`${invalidJsonTimeJsonUrl}/timeJSON`, () => {
  return new HttpResponse('{', {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

export const badContentTypeTimeJsonUrl = 'https://badContentType.simple-http.com';
export const badContentTypeTimeJsonHandler = http.get(`${badContentTypeTimeJsonUrl}/timeJSON`, () => {
  return HttpResponse.text(JSON.stringify({ time: getTime(new Date()) }));
});

export const httpErrorTimeJsonUrl = 'https://httperror.simple-http.com';
export const httpErrorTimeJsonHandler = http.get(`${httpErrorTimeJsonUrl}/timeJSON`, () => {
  return new HttpResponse(null, { status: 400 });
});

export const networkErrorTimeJsonUrl = 'https://neterror.simple-http.com';
export const networkErrorTimeJsonHandler = http.get(`${networkErrorTimeJsonUrl}/timeJSON`, () => {
  return HttpResponse.error();
});
