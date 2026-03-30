import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { page2Grader } from '../../../../../src/main/projects/simple-http/graders/page-2';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badPage2Url, goodPage2Url, httpErrorPage2Url, networkErrorPage2Url } from '../mocks/page-2-handlers';

describe('Page 2 tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('Grader passes good assignment', async () => {
    const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
    const result = await page2Grader.run(goodPage2Url);

    expect(result).toMatchObject(expected);
  });

  test('Grader fails bad assignment', async () => {
    const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
    const result = await page2Grader.run(badPage2Url);

    expect(result).toMatchObject(expected);
  });

  test('Grader errors a non 200 response', async () => {
    const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
    const result = await page2Grader.run(httpErrorPage2Url);

    expect(result).toMatchObject(expected);
  });

  test('Grader errors on network error', async () => {
    const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
    const result = await page2Grader.run(networkErrorPage2Url);

    expect(result).toMatchObject(expected);
  });
});
