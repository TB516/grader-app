import { Effect, Schema } from 'effect';
import { HttpClient } from 'effect/http';

import { CheckFailed, type Check } from '../grading/check';
import { expectContentType, expectStatus, getHtml, readJson, readXml } from '../grading/response';

/**
 * Chrome's Accept header when visiting a URL directly. It includes application/xml, so a server
 * that answers XML whenever "xml" appears fails the PDF's direct calls, which show JSON.
 */
const BROWSER_ACCEPT =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';

/** Each way the PDF asks for a response, and the Content-Type it expects back. */
const formats = [
  { accept: 'application/json', contentType: 'application/json' },
  { accept: 'text/xml', contentType: 'text/xml' },
  { accept: BROWSER_ACCEPT, contentType: 'application/json' }
];

/** Requests `path` in each format, expecting `status` and the requested Content-Type. */
const expectStatusInEachFormat = Effect.fnUntraced(function* (path: string, status: number) {
  for (const { accept, contentType } of formats) {
    const response = yield* HttpClient.get(path, { accept });
    yield* expectStatus(response, status);
    yield* expectContentType(response, contentType);
  }
});

const inEachFormat = 'as JSON, as XML, and as JSON to a browser';

/** Successes need a message. Other fields are allowed. */
const SuccessBody = Schema.Struct({ message: Schema.NonEmptyString });

/** Errors need a message and an id naming the error. Other fields are allowed. */
const errorBody = (id: string) =>
  Schema.Struct({ message: Schema.NonEmptyString, id: Schema.Literal(id) });

/** Every response the PDF describes, with error ids named as in its examples. */
const responses = [
  { path: '/success', body: SuccessBody },
  { path: '/badRequest?valid=true', body: SuccessBody },
  { path: '/badRequest', body: errorBody('badRequest') },
  { path: '/unauthorized?loggedIn=yes', body: SuccessBody },
  { path: '/unauthorized', body: errorBody('unauthorized') },
  { path: '/forbidden', body: errorBody('forbidden') },
  { path: '/internal', body: errorBody('internalError') },
  { path: '/notImplemented', body: errorBody('notImplemented') },
  { path: '/this-page-does-not-exist', body: errorBody('notFound') }
];

export const httpApi1: Check[] = [
  {
    label: 'Home page is HTML',
    run: Effect.gen(function* () {
      yield* getHtml('/');
      return '/ returned an HTML page';
    })
  },
  {
    label: '/style.css is served as text/css',
    run: Effect.gen(function* () {
      const response = yield* HttpClient.get('/style.css');
      yield* expectStatus(response, 200);
      yield* expectContentType(response, 'text/css');

      const css = yield* response.text;
      if (!css.trim()) return yield* new CheckFailed({ message: '/style.css was empty' });

      return '/style.css returned CSS';
    })
  },
  {
    label: '/success returns 200',
    run: Effect.gen(function* () {
      yield* expectStatusInEachFormat('/success', 200);
      return `/success returned 200 ${inEachFormat}`;
    })
  },
  {
    label: '/badRequest returns 400, or 200 with ?valid=true',
    run: Effect.gen(function* () {
      yield* expectStatusInEachFormat('/badRequest', 400);
      yield* expectStatusInEachFormat('/badRequest?valid=true', 200);
      return `/badRequest returned 400 and 200 ${inEachFormat}`;
    })
  },
  {
    label: '/unauthorized returns 401, or 200 with ?loggedIn=yes',
    run: Effect.gen(function* () {
      yield* expectStatusInEachFormat('/unauthorized', 401);
      yield* expectStatusInEachFormat('/unauthorized?loggedIn=yes', 200);
      return `/unauthorized returned 401 and 200 ${inEachFormat}`;
    })
  },
  {
    label: '/forbidden returns 403',
    run: Effect.gen(function* () {
      yield* expectStatusInEachFormat('/forbidden', 403);
      return `/forbidden returned 403 ${inEachFormat}`;
    })
  },
  {
    label: '/internal returns 500',
    run: Effect.gen(function* () {
      yield* expectStatusInEachFormat('/internal', 500);
      return `/internal returned 500 ${inEachFormat}`;
    })
  },
  {
    label: '/notImplemented returns 501',
    run: Effect.gen(function* () {
      yield* expectStatusInEachFormat('/notImplemented', 501);
      return `/notImplemented returned 501 ${inEachFormat}`;
    })
  },
  {
    label: 'Unknown URLs return 404',
    run: Effect.gen(function* () {
      yield* expectStatusInEachFormat('/this-page-does-not-exist', 404);
      return `An unknown URL returned 404 ${inEachFormat}`;
    })
  },
  {
    label: 'JSON responses have a message, and errors an id',
    run: Effect.gen(function* () {
      for (const { path, body } of responses) {
        const response = yield* HttpClient.get(path, { accept: 'application/json' });
        yield* readJson(response, body);
      }

      return `All ${responses.length} JSON responses had a message, and errors the right id`;
    })
  },
  {
    label: 'XML responses have a message, and errors an id',
    run: Effect.gen(function* () {
      for (const { path, body } of responses) {
        const response = yield* HttpClient.get(path, { accept: 'text/xml' });
        yield* readXml(response, Schema.Struct({ response: body }));
      }

      return `All ${responses.length} XML responses had a message, and errors the right id`;
    })
  }
];
