import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { timeTextGrader } from '../../../../../src/main/projects/simple-http/graders/time-text';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badContentTypeTimeTextBaseUrl,
  badTimeTextBaseUrl,
  goodTimeTextBaseUrl,
  httpErrorTimeTextBaseUrl,
  networkErrorTimeTextBaseUrl,
  timeParseFailureTimeTextBaseUrl
} from '../mocks/time-text-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodTimeTextBaseUrl), timeTextGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badTimeTextBaseUrl), timeTextGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(httpErrorTimeTextBaseUrl), timeTextGrader));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(networkErrorTimeTextBaseUrl), timeTextGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the time string does not parse', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(timeParseFailureTimeTextBaseUrl), timeTextGrader));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'text/plain'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badContentTypeTimeTextBaseUrl), timeTextGrader));

  expect(result).toMatchObject(expected);
});
