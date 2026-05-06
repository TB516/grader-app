import { http, HttpResponse } from 'msw';

type ApiResult = {
  status: number;
  message: string;
  id?: string;
};

type ApiOverride = Partial<{
  status: number;
  contentType: string;
  body: string;
  jsonBody: Record<string, unknown>;
  xmlBody: string;
}>;

const routes: Record<string, ApiResult> = {
  '/success': { status: 200, message: 'Success' },
  '/badRequest': { status: 400, message: 'Bad Request', id: 'badRequest' },
  '/unauthorized': { status: 401, message: 'Unauthorized', id: 'unauthorized' },
  '/forbidden': { status: 403, message: 'Forbidden', id: 'forbidden' },
  '/internal': { status: 500, message: 'Internal Error', id: 'internalError' },
  '/notImplemented': { status: 501, message: 'Not Implemented', id: 'notImplemented' },
  '/__grader_unknown_route__': { status: 404, message: 'Not Found', id: 'notFound' }
};

const routeResult = (request: Request): ApiResult => {
  const url = new URL(request.url);

  if (url.pathname === '/badRequest' && url.searchParams.get('valid') === 'true') {
    return { status: 200, message: 'Bad Request Valid' };
  }

  if (url.pathname === '/unauthorized' && url.searchParams.get('loggedIn') === 'yes') {
    return { status: 200, message: 'Unauthorized Logged In' };
  }

  return routes[url.pathname] ?? routes['/__grader_unknown_route__'];
};

const jsonResponse = (result: ApiResult, override?: ApiOverride): HttpResponse => {
  return HttpResponse.json(override?.jsonBody ?? result, { status: override?.status ?? result.status });
};

const xmlForResult = (result: ApiResult): string => {
  const id = result.id ? `<id>${result.id}</id>` : '';
  return `<response><message>${result.message}</message>${id}</response>`;
};

const xmlResponse = (result: ApiResult, override?: ApiOverride): HttpResponse => {
  return new HttpResponse(override?.xmlBody ?? xmlForResult(result), {
    status: override?.status ?? result.status,
    headers: { 'Content-Type': override?.contentType ?? 'text/xml' }
  });
};

const negotiatedResponse = (request: Request, override?: ApiOverride): HttpResponse => {
  const result = routeResult(request);
  const accept = request.headers.get('Accept') ?? '';

  if (override?.body) {
    return new HttpResponse(override.body, {
      status: override.status ?? result.status,
      headers: { 'Content-Type': override.contentType ?? 'application/json' }
    });
  }

  if (accept.includes('text/xml')) return xmlResponse(result, override);

  if (override?.contentType) {
    return new HttpResponse(JSON.stringify(override.jsonBody ?? result), {
      status: override.status ?? result.status,
      headers: { 'Content-Type': override.contentType }
    });
  }

  return jsonResponse(result, override);
};

const apiHandlers = (baseUrl: string, override?: ApiOverride) => {
  return [
    http.get(`${baseUrl}/success`, ({ request }) => negotiatedResponse(request, override)),
    http.get(`${baseUrl}/badRequest`, ({ request }) => negotiatedResponse(request, override)),
    http.get(`${baseUrl}/unauthorized`, ({ request }) => negotiatedResponse(request, override)),
    http.get(`${baseUrl}/forbidden`, ({ request }) => negotiatedResponse(request, override)),
    http.get(`${baseUrl}/internal`, ({ request }) => negotiatedResponse(request, override)),
    http.get(`${baseUrl}/notImplemented`, ({ request }) => negotiatedResponse(request, override)),
    http.get(`${baseUrl}/__grader_unknown_route__`, ({ request }) => negotiatedResponse(request, override))
  ];
};

const pageHandlers = (baseUrl: string) => {
  return [
    http.get(baseUrl, () => HttpResponse.html('<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body></body></html>')),
    http.get(`${baseUrl}/style.css`, () => new HttpResponse('body { color: black; }', { headers: { 'Content-Type': 'text/css' } }))
  ];
};

export const goodHttpApi1Url = 'https://good.http-api-1.com';
export const goodHttpApi1Handlers = [...pageHandlers(goodHttpApi1Url), ...apiHandlers(goodHttpApi1Url)];

export const emptyHomePageUrl = 'https://empty-home.http-api-1.com';
export const emptyHomePageHandler = http.get(emptyHomePageUrl, () => HttpResponse.html(''));

export const badHomePageContentTypeUrl = 'https://bad-home-content-type.http-api-1.com';
export const badHomePageContentTypeHandler = http.get(badHomePageContentTypeUrl, () => HttpResponse.text('<html></html>'));

export const httpErrorHomePageUrl = 'https://http-error-home.http-api-1.com';
export const httpErrorHomePageHandler = http.get(httpErrorHomePageUrl, () => new HttpResponse(null, { status: 500 }));

export const networkErrorHomePageUrl = 'https://network-error-home.http-api-1.com';
export const networkErrorHomePageHandler = http.get(networkErrorHomePageUrl, () => HttpResponse.error());

export const emptyStyleCssUrl = 'https://empty-style.http-api-1.com';
export const emptyStyleCssHandlers = [
  http.get(`${emptyStyleCssUrl}/style.css`, () => new HttpResponse('', { headers: { 'Content-Type': 'text/css' } }))
];

export const badStyleCssContentTypeUrl = 'https://bad-style-content-type.http-api-1.com';
export const badStyleCssContentTypeHandlers = [http.get(`${badStyleCssContentTypeUrl}/style.css`, () => HttpResponse.text('body {}'))];

export const httpErrorStyleCssUrl = 'https://http-error-style.http-api-1.com';
export const httpErrorStyleCssHandlers = [http.get(`${httpErrorStyleCssUrl}/style.css`, () => new HttpResponse(null, { status: 500 }))];

export const networkErrorStyleCssUrl = 'https://network-error-style.http-api-1.com';
export const networkErrorStyleCssHandlers = [http.get(`${networkErrorStyleCssUrl}/style.css`, () => HttpResponse.error())];

export const badJsonDefaultUrl = 'https://bad-json-default.http-api-1.com';
export const badJsonDefaultHandlers = apiHandlers(badJsonDefaultUrl, {
  contentType: 'text/xml',
  xmlBody: '<response><message>Success</message></response>'
});

export const badJsonStatusUrl = 'https://bad-json-status.http-api-1.com';
export const badJsonStatusHandlers = apiHandlers(badJsonStatusUrl, { status: 201 });

export const badJsonContentTypeUrl = 'https://bad-json-content-type.http-api-1.com';
export const badJsonContentTypeHandlers = apiHandlers(badJsonContentTypeUrl, { contentType: 'text/plain' });

export const invalidJsonUrl = 'https://invalid-json.http-api-1.com';
export const invalidJsonHandlers = apiHandlers(invalidJsonUrl, { body: '{', contentType: 'application/json' });

export const missingJsonMessageUrl = 'https://missing-json-message.http-api-1.com';
export const missingJsonMessageHandlers = apiHandlers(missingJsonMessageUrl, { jsonBody: { id: 'badRequest' } });

export const wrongJsonIdUrl = 'https://wrong-json-id.http-api-1.com';
export const wrongJsonIdHandlers = apiHandlers(wrongJsonIdUrl, { jsonBody: { message: 'Bad Request', id: 'wrongId' } });

export const badXmlStatusUrl = 'https://bad-xml-status.http-api-1.com';
export const badXmlStatusHandlers = apiHandlers(badXmlStatusUrl, { status: 201 });

export const badXmlContentTypeUrl = 'https://bad-xml-content-type.http-api-1.com';
export const badXmlContentTypeHandlers = apiHandlers(badXmlContentTypeUrl, { contentType: 'text/plain' });

export const missingXmlMessageUrl = 'https://missing-xml-message.http-api-1.com';
export const missingXmlMessageHandlers = apiHandlers(missingXmlMessageUrl, { xmlBody: '<response><id>badRequest</id></response>' });

export const wrongXmlIdUrl = 'https://wrong-xml-id.http-api-1.com';
export const wrongXmlIdHandlers = apiHandlers(wrongXmlIdUrl, { xmlBody: '<response><message>Bad Request</message><id>wrongId</id></response>' });

export const networkErrorApiUrl = 'https://network-error-api.http-api-1.com';
export const networkErrorApiHandlers = [
  http.get(`${networkErrorApiUrl}/success`, () => HttpResponse.error()),
  http.get(`${networkErrorApiUrl}/badRequest`, () => HttpResponse.error()),
  http.get(`${networkErrorApiUrl}/unauthorized`, () => HttpResponse.error()),
  http.get(`${networkErrorApiUrl}/forbidden`, () => HttpResponse.error()),
  http.get(`${networkErrorApiUrl}/internal`, () => HttpResponse.error()),
  http.get(`${networkErrorApiUrl}/notImplemented`, () => HttpResponse.error()),
  http.get(`${networkErrorApiUrl}/__grader_unknown_route__`, () => HttpResponse.error())
];
