import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { unknownRouteGrader } from '../../../../../src/main/projects/http-api-2/graders/unknown-route';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badUnknownRouteJsonUrl, badUnknownRouteStatusUrl, goodHttpApi2Url } from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), unknownRouteGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 404 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badUnknownRouteStatusUrl), unknownRouteGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails malformed JSON errors when JSON is returned', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badUnknownRouteJsonUrl), unknownRouteGrader));

  expect(result).toMatchObject(expected);
});

test('Grader requires a JSON error for an arbitrary unknown route', async () => {
  server.use(http.get(`${goodHttpApi2Url}/__grader_unknown_route__`, () => new HttpResponse(null, { status: 404 })));
  expect((await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), unknownRouteGrader))).status).toBe('fail');
});
