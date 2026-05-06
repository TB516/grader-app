import { http, HttpResponse } from 'msw';

export const goodStreamingMediaUrl = 'https://good.streaming-media.com';
export const http200StreamingMediaUrl = 'https://http200.streaming-media.com';
export const badContentTypeStreamingMediaUrl = 'https://bad-content-type.streaming-media.com';
export const badAcceptRangesStreamingMediaUrl = 'https://bad-accept-ranges.streaming-media.com';
export const badContentRangeStreamingMediaUrl = 'https://bad-content-range.streaming-media.com';
export const emptyMediaStreamingMediaUrl = 'https://empty-media.streaming-media.com';
export const badSignatureStreamingMediaUrl = 'https://bad-signature.streaming-media.com';
export const httpErrorMediaStreamingMediaUrl = 'https://httperror-media.streaming-media.com';
export const networkErrorMediaStreamingMediaUrl = 'https://neterror-media.streaming-media.com';

const mp4Bytes = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]);
const mp3Bytes = new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0, 0x54, 0x49, 0x54, 0x32, 0, 0]);
const badBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

type MediaEndpoint = {
  path: string;
  contentType: string;
  body: Uint8Array;
};

const endpoints: MediaEndpoint[] = [
  { path: '/party.mp4', contentType: 'video/mp4', body: mp4Bytes },
  { path: '/bling.mp3', contentType: 'audio/mpeg', body: mp3Bytes },
  { path: '/bird.mp4', contentType: 'video/mp4', body: mp4Bytes }
];

const rangeHeaders = (body: Uint8Array, contentType: string, overrides: Record<string, string> = {}) => ({
  'Accept-Ranges': 'bytes',
  'Content-Range': `bytes 0-${body.length - 1}/100`,
  'Content-Length': body.length.toString(),
  'Content-Type': contentType,
  ...overrides
});

const rangeResponse = (body: Uint8Array, contentType: string, overrides: Record<string, string> = {}) => {
  return new HttpResponse(body, {
    status: 206,
    headers: rangeHeaders(body, contentType, overrides)
  });
};

export const goodMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${goodStreamingMediaUrl}${endpoint.path}`, () => rangeResponse(endpoint.body, endpoint.contentType));
});

export const http200MediaHandlers = endpoints.map((endpoint) => {
  return http.get(
    `${http200StreamingMediaUrl}${endpoint.path}`,
    () =>
      new HttpResponse(endpoint.body, {
        status: 200,
        headers: rangeHeaders(endpoint.body, endpoint.contentType)
      })
  );
});

export const badContentTypeMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${badContentTypeStreamingMediaUrl}${endpoint.path}`, () => rangeResponse(endpoint.body, 'application/octet-stream'));
});

export const badAcceptRangesMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${badAcceptRangesStreamingMediaUrl}${endpoint.path}`, () => {
    return rangeResponse(endpoint.body, endpoint.contentType, { 'Accept-Ranges': 'none' });
  });
});

export const badContentRangeMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${badContentRangeStreamingMediaUrl}${endpoint.path}`, () => {
    return rangeResponse(endpoint.body, endpoint.contentType, { 'Content-Range': 'wat' });
  });
});

export const emptyMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${emptyMediaStreamingMediaUrl}${endpoint.path}`, () => {
    return new HttpResponse(new Uint8Array([]), {
      status: 206,
      headers: rangeHeaders(new Uint8Array([]), endpoint.contentType, { 'Content-Range': 'bytes 0-0/100' })
    });
  });
});

export const badSignatureMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${badSignatureStreamingMediaUrl}${endpoint.path}`, () => rangeResponse(badBytes, endpoint.contentType));
});

export const httpErrorMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${httpErrorMediaStreamingMediaUrl}${endpoint.path}`, () => new HttpResponse(null, { status: 404 }));
});

export const networkErrorMediaHandlers = endpoints.map((endpoint) => {
  return http.get(`${networkErrorMediaStreamingMediaUrl}${endpoint.path}`, () => HttpResponse.error());
});
