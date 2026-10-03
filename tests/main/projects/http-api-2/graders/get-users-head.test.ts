import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { getUsersHeadGrader } from '../../../../../src/main/projects/http-api-2/graders/get-users-head';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badGetUsersHeadContentTypeUrl, badGetUsersHeadStatusUrl, goodHttpApi2Url } from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), getUsersHeadGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badGetUsersHeadStatusUrl), getUsersHeadGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a present non JSON content type', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badGetUsersHeadContentTypeUrl), getUsersHeadGrader));

  expect(result).toMatchObject(expected);
});

test('Grader rejects a HEAD response missing its JSON Content-Type', async () => {
  server.use(http.head(`${goodHttpApi2Url}/getUsers`, () => new HttpResponse(null, { status: 200 })));
  expect((await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), getUsersHeadGrader))).status).toBe('fail');
});
