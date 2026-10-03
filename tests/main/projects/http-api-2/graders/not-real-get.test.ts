import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { notRealGetGrader } from '../../../../../src/main/projects/http-api-2/graders/not-real-get';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badNotRealGetContentTypeUrl, badNotRealGetShapeUrl, badNotRealGetStatusUrl, goodHttpApi2Url } from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), notRealGetGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 404 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badNotRealGetStatusUrl), notRealGetGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails JSON without an error id', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badNotRealGetShapeUrl), notRealGetGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad content type', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badNotRealGetContentTypeUrl), notRealGetGrader));

  expect(result).toMatchObject(expected);
});
