import { http, HttpResponse } from 'msw';

export const indexPageHandler = http.get('https://example.com', () => {
  return HttpResponse.html(``);
});
