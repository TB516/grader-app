import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { timeJsonGrader } from '../../../../../src/main/projects/simple-http/graders/time-json';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badContentTypeTimeJsonUrl,
  badShapeTimeJsonUrl,
  badTimeJsonUrl,
  goodTimeJsonUrl,
  httpErrorTimeJsonUrl,
  invalidJsonTimeJsonUrl,
  networkErrorTimeJsonUrl,
  timeParseFailureTimeJsonUrl
} from '../mocks/time-json-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the JSON shape is wrong', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badShapeTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the time string does not parse', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(timeParseFailureTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the JSON body is invalid', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(invalidJsonTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'application/json'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badContentTypeTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(httpErrorTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(networkErrorTimeJsonUrl), timeJsonGrader));

  expect(result).toMatchObject(expected);
});
