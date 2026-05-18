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

type HomePageOptions = {
  includeCssLink?: boolean;
  includeRouteControls?: boolean;
  includeTypeControls?: boolean;
  includeSendTrigger?: boolean;
  includeAcceptHeader?: boolean;
  includeContentTypeBranch?: boolean;
  includeJsonParse?: boolean;
  includeXmlHandling?: boolean;
  includeConsoleLog?: boolean;
};

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

const apiHandlers = (baseUrl: string, routeOverrides?: Partial<Record<string, ApiOverride>>) => {
  const responseFor = (request: Request): HttpResponse => {
    const url = new URL(request.url);

    return negotiatedResponse(request, routeOverrides?.[url.pathname]);
  };

  return [
    http.get(`${baseUrl}/success`, ({ request }) => responseFor(request)),
    http.get(`${baseUrl}/badRequest`, ({ request }) => responseFor(request)),
    http.get(`${baseUrl}/unauthorized`, ({ request }) => responseFor(request)),
    http.get(`${baseUrl}/forbidden`, ({ request }) => responseFor(request)),
    http.get(`${baseUrl}/internal`, ({ request }) => responseFor(request)),
    http.get(`${baseUrl}/notImplemented`, ({ request }) => responseFor(request)),
    http.get(`${baseUrl}/__grader_unknown_route__`, ({ request }) => responseFor(request))
  ];
};

const homePageHtml = ({
  includeCssLink = true,
  includeRouteControls = true,
  includeTypeControls = true,
  includeSendTrigger = true,
  includeAcceptHeader = true,
  includeContentTypeBranch = true,
  includeJsonParse = true,
  includeXmlHandling = true,
  includeConsoleLog = true
}: HomePageOptions = {}): string => {
  const cssLink = includeCssLink ? '<link rel="stylesheet" href="/style.css">' : '';
  const routeOptions = includeRouteControls
    ? `
        <select id="page">
          <option value="/success">Success</option>
          <option value="/badRequest">Bad Request</option>
          <option value="/unauthorized">Unauthorized</option>
          <option value="/forbidden">Forbidden</option>
          <option value="/internal">Internal</option>
          <option value="/notImplemented">Not Implemented</option>
        </select>
      `
    : '';
  const typeOptions = includeTypeControls
    ? `
        <select id="type">
          <option value="application/json">JSON</option>
          <option value="text/xml">XML</option>
        </select>
      `
    : '';
  const sendTrigger = includeSendTrigger ? '<button id="send">Send</button>' : '';
  const acceptHeader = includeAcceptHeader ? 'headers: { Accept: type },' : '';
  const contentTypeBranch = includeContentTypeBranch
    ? "if (response.headers.get('Content-Type')?.includes('application/json')) {"
    : 'if (response.ok) {';
  const jsonParse = includeJsonParse ? 'return JSON.parse(responseText);' : 'return responseText;';
  const xmlHandling = includeXmlHandling
    ? "const xmlBits = responseText.replaceAll(/<[^>]+>/g, '~').split('~').filter(Boolean); return { message: xmlBits.at(-1), id: xmlBits[0] };"
    : 'return responseText;';
  const consoleLog = includeConsoleLog ? 'console.log(responseText);' : '';

  return `<!doctype html>
<html>
  <head>
    ${cssLink}
    <script>
      const getData = async () => {
        const page = document.getElementById('page')?.value ?? '/success';
        const type = document.getElementById('type')?.value ?? 'application/json';
        return await fetch(page, {
          ${acceptHeader}
        });
      };

      const parseData = (responseText, response) => {
        ${contentTypeBranch}
          ${jsonParse}
        }

        ${xmlHandling}
      };

      const sendRequest = async () => {
        const response = await getData();
        const responseText = await response.text();
        ${consoleLog}
        return parseData(responseText, response);
      };

      window.onload = () => {
        const sendButton = document.getElementById('send');
        if (sendButton) sendButton.onclick = sendRequest;
      };
    </script>
  </head>
  <body>
    <section id="controls">
      ${routeOptions}
      ${typeOptions}
      ${sendTrigger}
    </section>
    <section id="content"></section>
  </body>
</html>`;
};

const pageHandlers = (baseUrl: string, options?: HomePageOptions) => {
  return [
    http.get(baseUrl, () => HttpResponse.html(homePageHtml(options))),
    http.get(`${baseUrl}/style.css`, () => new HttpResponse('body { color: black; }', { headers: { 'Content-Type': 'text/css' } }))
  ];
};

export const goodHttpApi1Url = 'https://good.http-api-1.com';
export const goodHttpApi1Handlers = [
  ...pageHandlers(goodHttpApi1Url),
  ...apiHandlers(goodHttpApi1Url, {
    '/success': { jsonBody: { id: 'success', message: 'Success' }, xmlBody: '<response><id>success</id><message>Success</message></response>' },
    '/internal': {
      jsonBody: { id: 'internalServerError', message: 'Internal Error' },
      xmlBody: '<response><message>Internal Error</message><id>internalServerError</id></response>'
    }
  })
];

export const goodHttpApi1InternalErrorUrl = 'https://good-internal-error.http-api-1.com';
export const goodHttpApi1InternalErrorHandlers = [
  ...pageHandlers(goodHttpApi1InternalErrorUrl),
  ...apiHandlers(goodHttpApi1InternalErrorUrl, {
    '/success': { jsonBody: { message: 'Success' }, xmlBody: '<response><message>Success</message></response>' },
    '/internal': {
      jsonBody: { id: 'internalError', message: 'Internal Error' },
      xmlBody: '<response><message>Internal Error</message><id>internalError</id></response>'
    }
  })
];

export const emptyHomePageUrl = 'https://empty-home.http-api-1.com';
export const emptyHomePageHandler = http.get(emptyHomePageUrl, () => HttpResponse.html(''));

export const badHomePageContentTypeUrl = 'https://bad-home-content-type.http-api-1.com';
export const badHomePageContentTypeHandler = http.get(badHomePageContentTypeUrl, () => HttpResponse.text('<html></html>'));

export const httpErrorHomePageUrl = 'https://http-error-home.http-api-1.com';
export const httpErrorHomePageHandler = http.get(httpErrorHomePageUrl, () => new HttpResponse(null, { status: 500 }));

export const networkErrorHomePageUrl = 'https://network-error-home.http-api-1.com';
export const networkErrorHomePageHandler = http.get(networkErrorHomePageUrl, () => HttpResponse.error());

export const missingHomePageCssLinkUrl = 'https://missing-home-css-link.http-api-1.com';
export const missingHomePageCssLinkHandlers = pageHandlers(missingHomePageCssLinkUrl, { includeCssLink: false });

export const missingHomePageRouteControlsUrl = 'https://missing-home-route-controls.http-api-1.com';
export const missingHomePageRouteControlsHandlers = pageHandlers(missingHomePageRouteControlsUrl, { includeRouteControls: false });

export const missingHomePageTypeControlsUrl = 'https://missing-home-type-controls.http-api-1.com';
export const missingHomePageTypeControlsHandlers = pageHandlers(missingHomePageTypeControlsUrl, { includeTypeControls: false });

export const missingHomePageSendTriggerUrl = 'https://missing-home-send-trigger.http-api-1.com';
export const missingHomePageSendTriggerHandlers = pageHandlers(missingHomePageSendTriggerUrl, { includeSendTrigger: false });

export const missingHomePageAcceptHeaderUrl = 'https://missing-home-accept-header.http-api-1.com';
export const missingHomePageAcceptHeaderHandlers = pageHandlers(missingHomePageAcceptHeaderUrl, { includeAcceptHeader: false });

export const missingHomePageContentTypeBranchUrl = 'https://missing-home-content-type-branch.http-api-1.com';
export const missingHomePageContentTypeBranchHandlers = pageHandlers(missingHomePageContentTypeBranchUrl, { includeContentTypeBranch: false });

export const missingHomePageJsonParseUrl = 'https://missing-home-json-parse.http-api-1.com';
export const missingHomePageJsonParseHandlers = pageHandlers(missingHomePageJsonParseUrl, { includeJsonParse: false });

export const missingHomePageXmlHandlingUrl = 'https://missing-home-xml-handling.http-api-1.com';
export const missingHomePageXmlHandlingHandlers = pageHandlers(missingHomePageXmlHandlingUrl, { includeXmlHandling: false });

export const missingHomePageConsoleLogUrl = 'https://missing-home-console-log.http-api-1.com';
export const missingHomePageConsoleLogHandlers = pageHandlers(missingHomePageConsoleLogUrl, { includeConsoleLog: false });

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
  '/success': {
    contentType: 'text/xml',
    xmlBody: '<response><message>Success</message></response>'
  }
});

export const badJsonStatusUrl = 'https://bad-json-status.http-api-1.com';
export const badJsonStatusHandlers = apiHandlers(badJsonStatusUrl, { '/success': { status: 201 } });

export const badJsonContentTypeUrl = 'https://bad-json-content-type.http-api-1.com';
export const badJsonContentTypeHandlers = apiHandlers(badJsonContentTypeUrl, { '/success': { contentType: 'text/plain' } });

export const invalidJsonUrl = 'https://invalid-json.http-api-1.com';
export const invalidJsonHandlers = apiHandlers(invalidJsonUrl, { '/success': { body: '{', contentType: 'application/json' } });

export const missingJsonMessageUrl = 'https://missing-json-message.http-api-1.com';
export const missingJsonMessageHandlers = apiHandlers(missingJsonMessageUrl, { '/badRequest': { jsonBody: { id: 'badRequest' } } });

export const wrongJsonIdUrl = 'https://wrong-json-id.http-api-1.com';
export const wrongJsonIdHandlers = apiHandlers(wrongJsonIdUrl, { '/badRequest': { jsonBody: { message: 'Bad Request', id: 'wrongId' } } });

export const badXmlStatusUrl = 'https://bad-xml-status.http-api-1.com';
export const badXmlStatusHandlers = apiHandlers(badXmlStatusUrl, { '/success': { status: 201 } });

export const badXmlContentTypeUrl = 'https://bad-xml-content-type.http-api-1.com';
export const badXmlContentTypeHandlers = apiHandlers(badXmlContentTypeUrl, { '/success': { contentType: 'text/plain' } });

export const missingXmlMessageUrl = 'https://missing-xml-message.http-api-1.com';
export const missingXmlMessageHandlers = apiHandlers(missingXmlMessageUrl, {
  '/badRequest': { xmlBody: '<response><id>badRequest</id></response>' }
});

export const wrongXmlIdUrl = 'https://wrong-xml-id.http-api-1.com';
export const wrongXmlIdHandlers = apiHandlers(wrongXmlIdUrl, {
  '/badRequest': { xmlBody: '<response><message>Bad Request</message><id>wrongId</id></response>' }
});

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
