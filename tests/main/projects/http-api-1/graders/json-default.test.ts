import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { jsonDefaultGrader } from '../../../../../src/main/projects/http-api-1/graders/json-default';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badJsonDefaultUrl, goodHttpApi1Url, networkErrorApiUrl } from '../mocks/http-api-1-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonDefaultGrader.run(new URL(goodHttpApi1Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails if API does not default to JSON', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonDefaultGrader.run(new URL(badJsonDefaultUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await jsonDefaultGrader.run(new URL(networkErrorApiUrl));

  expect(result).toMatchObject(expected);
});
