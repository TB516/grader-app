import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { jsonEndpointsGrader } from '../../../../../src/main/projects/http-api-1/graders/json-endpoints';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badJsonContentTypeUrl,
  badJsonStatusUrl,
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
  const result = await jsonEndpointsGrader.run(new URL(goodHttpApi1Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails if a status is wrong', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonEndpointsGrader.run(new URL(badJsonStatusUrl));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'application/json'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonEndpointsGrader.run(new URL(badJsonContentTypeUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if JSON is invalid', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonEndpointsGrader.run(new URL(invalidJsonUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if JSON message is missing', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonEndpointsGrader.run(new URL(missingJsonMessageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if JSON error id is wrong', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonEndpointsGrader.run(new URL(wrongJsonIdUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonEndpointsGrader.run(new URL(networkErrorApiUrl));

  expect(result).toMatchObject(expected);
});
