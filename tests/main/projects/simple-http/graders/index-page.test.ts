import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { indexPageGrader } from '../../../../../src/main/projects/simple-http/graders/index-page';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badIndexPageUrl, goodIndexPageUrl, httpErrorIndexPageUrl, networkErrorIndexPageUrl } from '../mocks/index-page-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(goodIndexPageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(badIndexPageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(httpErrorIndexPageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(networkErrorIndexPageUrl));

  expect(result).toMatchObject(expected);
});
