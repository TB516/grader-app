import { http, HttpResponse } from 'msw';

export default http.get('https://example.com', () => {
  return HttpResponse.html(``);
});
