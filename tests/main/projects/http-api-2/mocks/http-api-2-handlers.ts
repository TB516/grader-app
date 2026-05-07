import { http, HttpResponse } from 'msw';

type User = {
  name: string;
  age: string;
};

const goodUsers: Record<string, User> = {};

const jsonError = () => HttpResponse.json({ message: 'Not found', id: 'notFound' }, { status: 404 });
const invalidUserError = () => HttpResponse.json({ message: 'Name and age are required', id: 'missingParams' }, { status: 400 });

const addUserHandlers = (baseUrl: string) => [
  http.post(`${baseUrl}/addUser`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const name = params.get('name');
    const age = params.get('age');

    if (!name || !age) return invalidUserError();

    if (goodUsers[name]) {
      goodUsers[name].age = age;

      return new HttpResponse(null, { status: 204 });
    }

    goodUsers[name] = { name, age };

    return HttpResponse.json({ message: 'Created' }, { status: 201 });
  })
];

export const resetGoodHttpApi2Users = (): void => {
  for (const key of Object.keys(goodUsers)) {
    delete goodUsers[key];
  }
};

export const goodHttpApi2Url = 'https://good.http-api-2.com';
export const goodHttpApi2Handlers = [
  http.get(goodHttpApi2Url, () =>
    HttpResponse.html('<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body>API II</body></html>')
  ),
  http.get(`${goodHttpApi2Url}/style.css`, () => HttpResponse.text('body { color: black; }', { headers: { 'Content-Type': 'text/css' } })),
  http.get(`${goodHttpApi2Url}/getUsers`, () => HttpResponse.json({ users: goodUsers })),
  http.head(`${goodHttpApi2Url}/getUsers`, () => new HttpResponse(null, { status: 200, headers: { 'Content-Type': 'application/json' } })),
  http.get(`${goodHttpApi2Url}/notReal`, () => jsonError()),
  http.head(`${goodHttpApi2Url}/notReal`, () => new HttpResponse(null, { status: 404, headers: { 'Content-Type': 'application/json' } })),
  http.get(`${goodHttpApi2Url}/__grader_unknown_route__`, () => new HttpResponse(null, { status: 404 })),
  ...addUserHandlers(goodHttpApi2Url)
];

export const badIndexPageUrl = 'https://bad-index.http-api-2.com';
export const badIndexPageHandler = http.get(badIndexPageUrl, () => HttpResponse.text('not html'));

export const emptyIndexPageUrl = 'https://empty-index.http-api-2.com';
export const emptyIndexPageHandler = http.get(emptyIndexPageUrl, () => HttpResponse.html(''));

export const httpErrorIndexPageUrl = 'https://http-error-index.http-api-2.com';
export const httpErrorIndexPageHandler = http.get(httpErrorIndexPageUrl, () => new HttpResponse(null, { status: 500 }));

export const networkErrorIndexPageUrl = 'https://network-error-index.http-api-2.com';
export const networkErrorIndexPageHandler = http.get(networkErrorIndexPageUrl, () => HttpResponse.error());

export const badStyleCssUrl = 'https://bad-style.http-api-2.com';
export const badStyleCssHandler = http.get(`${badStyleCssUrl}/style.css`, () => HttpResponse.html('<style></style>'));

export const emptyStyleCssUrl = 'https://empty-style.http-api-2.com';
export const emptyStyleCssHandler = http.get(`${emptyStyleCssUrl}/style.css`, () =>
  HttpResponse.text('', { headers: { 'Content-Type': 'text/css' } })
);

export const httpErrorStyleCssUrl = 'https://http-error-style.http-api-2.com';
export const httpErrorStyleCssHandler = http.get(`${httpErrorStyleCssUrl}/style.css`, () => new HttpResponse(null, { status: 500 }));

export const badGetUsersGetUrl = 'https://bad-get-users.http-api-2.com';
export const badGetUsersGetHandler = http.get(`${badGetUsersGetUrl}/getUsers`, () => HttpResponse.json([]));

export const invalidJsonGetUsersGetUrl = 'https://invalid-json-get-users.http-api-2.com';
export const invalidJsonGetUsersGetHandler = http.get(
  `${invalidJsonGetUsersGetUrl}/getUsers`,
  () => new HttpResponse('{', { headers: { 'Content-Type': 'application/json' } })
);

export const badContentTypeGetUsersGetUrl = 'https://bad-content-type-get-users.http-api-2.com';
export const badContentTypeGetUsersGetHandler = http.get(`${badContentTypeGetUsersGetUrl}/getUsers`, () =>
  HttpResponse.text(JSON.stringify({ users: {} }))
);

export const httpErrorGetUsersGetUrl = 'https://http-error-get-users.http-api-2.com';
export const httpErrorGetUsersGetHandler = http.get(`${httpErrorGetUsersGetUrl}/getUsers`, () => new HttpResponse(null, { status: 500 }));

export const badGetUsersHeadStatusUrl = 'https://bad-head-status-get-users.http-api-2.com';
export const badGetUsersHeadStatusHandler = http.head(`${badGetUsersHeadStatusUrl}/getUsers`, () => new HttpResponse(null, { status: 500 }));

export const badGetUsersHeadContentTypeUrl = 'https://bad-head-content-type-get-users.http-api-2.com';
export const badGetUsersHeadContentTypeHandler = http.head(
  `${badGetUsersHeadContentTypeUrl}/getUsers`,
  () => new HttpResponse(null, { status: 200, headers: { 'Content-Type': 'text/plain' } })
);

export const badNotRealGetStatusUrl = 'https://bad-not-real-status.http-api-2.com';
export const badNotRealGetStatusHandler = http.get(`${badNotRealGetStatusUrl}/notReal`, () => HttpResponse.json({ message: 'ok', id: 'ok' }));

export const badNotRealGetShapeUrl = 'https://bad-not-real-shape.http-api-2.com';
export const badNotRealGetShapeHandler = http.get(`${badNotRealGetShapeUrl}/notReal`, () =>
  HttpResponse.json({ message: 'Missing id' }, { status: 404 })
);

export const badNotRealGetContentTypeUrl = 'https://bad-not-real-content-type.http-api-2.com';
export const badNotRealGetContentTypeHandler = http.get(`${badNotRealGetContentTypeUrl}/notReal`, () =>
  HttpResponse.text(JSON.stringify({ message: 'Missing', id: 'missing' }), { status: 404 })
);

export const badNotRealHeadStatusUrl = 'https://bad-not-real-head-status.http-api-2.com';
export const badNotRealHeadStatusHandler = http.head(`${badNotRealHeadStatusUrl}/notReal`, () => new HttpResponse(null, { status: 200 }));

export const badNotRealHeadContentTypeUrl = 'https://bad-not-real-head-content-type.http-api-2.com';
export const badNotRealHeadContentTypeHandler = http.head(
  `${badNotRealHeadContentTypeUrl}/notReal`,
  () => new HttpResponse(null, { status: 404, headers: { 'Content-Type': 'text/plain' } })
);

export const badUnknownRouteStatusUrl = 'https://bad-unknown-status.http-api-2.com';
export const badUnknownRouteStatusHandler = http.get(
  `${badUnknownRouteStatusUrl}/__grader_unknown_route__`,
  () => new HttpResponse(null, { status: 200 })
);

export const badUnknownRouteJsonUrl = 'https://bad-unknown-json.http-api-2.com';
export const badUnknownRouteJsonHandler = http.get(`${badUnknownRouteJsonUrl}/__grader_unknown_route__`, () =>
  HttpResponse.json({ message: 'Missing id' }, { status: 404 })
);

export const badAddUserCreateStatusUrl = 'https://bad-add-create-status.http-api-2.com';
export const badAddUserCreateStatusHandlers = [
  http.post(`${badAddUserCreateStatusUrl}/addUser`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    if (!params.get('name') || !params.get('age')) return invalidUserError();

    return HttpResponse.json({ message: 'Wrong status' }, { status: 200 });
  })
];

export const badAddUserNoPersistUrl = 'https://bad-add-no-persist.http-api-2.com';
export const badAddUserNoPersistHandlers = [
  http.post(`${badAddUserNoPersistUrl}/addUser`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    if (!params.get('name') || !params.get('age')) return invalidUserError();

    return HttpResponse.json({ message: 'Created' }, { status: 201 });
  }),
  http.get(`${badAddUserNoPersistUrl}/getUsers`, () => HttpResponse.json({ users: {} }))
];

export const badAddUserUpdateStatusUrl = 'https://bad-add-update-status.http-api-2.com';
const updateStatusUsers: Record<string, User> = {};
export const badAddUserUpdateStatusHandlers = [
  http.post(`${badAddUserUpdateStatusUrl}/addUser`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const name = params.get('name');
    const age = params.get('age');
    if (!name || !age) return invalidUserError();

    if (updateStatusUsers[name]) {
      updateStatusUsers[name].age = age;

      return HttpResponse.json({ message: 'Wrong status' }, { status: 200 });
    }

    updateStatusUsers[name] = { name, age };

    return HttpResponse.json({ message: 'Created' }, { status: 201 });
  }),
  http.get(`${badAddUserUpdateStatusUrl}/getUsers`, () => HttpResponse.json({ users: updateStatusUsers }))
];

export const badAddUserNoUpdateUrl = 'https://bad-add-no-update.http-api-2.com';
const staleUsers: Record<string, User> = {};
export const badAddUserNoUpdateHandlers = [
  http.post(`${badAddUserNoUpdateUrl}/addUser`, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const name = params.get('name');
    const age = params.get('age');
    if (!name || !age) return invalidUserError();

    if (!staleUsers[name]) staleUsers[name] = { name, age };

    return staleUsers[name].age === age ? HttpResponse.json({ message: 'Created' }, { status: 201 }) : new HttpResponse(null, { status: 204 });
  }),
  http.get(`${badAddUserNoUpdateUrl}/getUsers`, () => HttpResponse.json({ users: staleUsers }))
];
