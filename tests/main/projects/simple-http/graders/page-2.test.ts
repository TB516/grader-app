import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { page2Grader } from '../../../../../src/main/projects/simple-http/graders/page-2';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badPage2BaseUrl, goodPage2BaseUrl, httpErrorPage2BaseUrl, networkErrorPage2BaseUrl } from '../mocks/page-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await page2Grader.run(new URL(goodPage2BaseUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await page2Grader.run(new URL(badPage2BaseUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await page2Grader.run(new URL(httpErrorPage2BaseUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await page2Grader.run(new URL(networkErrorPage2BaseUrl));

  expect(result).toMatchObject(expected);
});
