import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { helloJsonGrader } from '../../../../../src/main/projects/simple-http/graders/hello-json';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badContentTypeHelloJsonUrl,
  badHelloJsonUrl,
  goodHelloJsonUrl,
  httpErrorHelloJsonUrl,
  invalidJsonHelloJsonUrl,
  networkErrorHelloJsonUrl
} from '../mocks/hello-json-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHelloJsonUrl), helloJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badHelloJsonUrl), helloJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the JSON body is invalid', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(invalidJsonHelloJsonUrl), helloJsonGrader));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'application/json'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badContentTypeHelloJsonUrl), helloJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(httpErrorHelloJsonUrl), helloJsonGrader));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(networkErrorHelloJsonUrl), helloJsonGrader));

  expect(result).toMatchObject(expected);
});
