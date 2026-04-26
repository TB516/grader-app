import { http, HttpResponse } from 'msw';

const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

export const goodDankmemesImageUrl = 'https://good.simple-http.com';
export const goodDankmemesImageHandler = http.get(`${goodDankmemesImageUrl}/dankmemes`, () => {
  return new HttpResponse(pngBytes, {
    headers: {
      'Content-Type': 'image/png'
    }
  });
});

export const badDankmemesImageUrl = 'https://bad.simple-http.com';
export const badDankmemesImageHandler = http.get(`${badDankmemesImageUrl}/dankmemes`, () => {
  return new HttpResponse(new Uint8Array([0, 1, 2, 3]), {
    headers: {
      'Content-Type': 'image/png'
    }
  });
});

export const emptyDankmemesImageUrl = 'https://empty.simple-http.com';
export const emptyDankmemesImageHandler = http.get(`${emptyDankmemesImageUrl}/dankmemes`, () => {
  return new HttpResponse(new Uint8Array([]), {
    headers: {
      'Content-Type': 'image/png'
    }
  });
});

export const badContentTypeDankmemesImageUrl = 'https://badContentType.simple-http.com';
export const badContentTypeDankmemesImageHandler = http.get(`${badContentTypeDankmemesImageUrl}/dankmemes`, () => {
  return new HttpResponse(pngBytes, {
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  });
});

export const httpErrorDankmemesImageUrl = 'https://httperror.simple-http.com';
export const httpErrorDankmemesImageHandler = http.get(`${httpErrorDankmemesImageUrl}/dankmemes`, () => {
  return new HttpResponse(null, { status: 400 });
});

export const networkErrorDankmemesImageUrl = 'https://neterror.simple-http.com';
export const networkErrorDankmemesImageHandler = http.get(`${networkErrorDankmemesImageUrl}/dankmemes`, () => {
  return HttpResponse.error();
});
