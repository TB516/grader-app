import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { jsonEndpointsGrader } from '../../../../../src/main/projects/http-api-1/graders/json-endpoints';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badJsonContentTypeUrl,
  badJsonStatusUrl,
  goodHttpApi1InternalErrorUrl,
  goodHttpApi1Url,
  invalidJsonUrl,
  missingJsonMessageUrl,
  networkErrorApiUrl,
  wrongJsonIdUrl
} from '../mocks/http-api-1-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi1Url), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test('Grader passes when /internal uses internalError id variant', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi1InternalErrorUrl), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if a status is wrong', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badJsonStatusUrl), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'application/json'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badJsonContentTypeUrl), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if JSON is invalid', async () => {
  const expected = { status: 'fail', message: '/success: Success JSON parsing failed' } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(invalidJsonUrl), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if JSON message is missing', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(missingJsonMessageUrl), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if JSON error id is wrong', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(wrongJsonIdUrl), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(networkErrorApiUrl), jsonEndpointsGrader));

  expect(result).toMatchObject(expected);
});

test('Grader rejects a server that accepts any valid query value', async () => {
  server.use(
    http.get(`${goodHttpApi1Url}/badRequest`, ({ request }) => {
      if (new URL(request.url).searchParams.has('valid')) return HttpResponse.json({ message: 'ok' });
      return HttpResponse.json({ message: 'Missing valid', id: 'badRequest' }, { status: 400 });
    })
  );
  expect((await Effect.runPromise(runGrader(new URL(goodHttpApi1Url), jsonEndpointsGrader))).status).toBe('fail');
});

test.each(['application/json-invalid', 'text/plain; application/json'])('Grader rejects a misleading Content-Type: %s', async (contentType) => {
  server.use(http.get(`${goodHttpApi1Url}/success`, () => new HttpResponse('{"message":"ok"}', { headers: { 'Content-Type': contentType } })));
  expect((await Effect.runPromise(runGrader(new URL(goodHttpApi1Url), jsonEndpointsGrader))).status).toBe('fail');
});
