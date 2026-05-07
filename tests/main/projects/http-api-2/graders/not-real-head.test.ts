import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { notRealHeadGrader } from '../../../../../src/main/projects/http-api-2/graders/not-real-head';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badNotRealHeadContentTypeUrl, badNotRealHeadStatusUrl, goodHttpApi2Url } from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await notRealHeadGrader.run(new URL(goodHttpApi2Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 404 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await notRealHeadGrader.run(new URL(badNotRealHeadStatusUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a present non JSON content type', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await notRealHeadGrader.run(new URL(badNotRealHeadContentTypeUrl));

  expect(result).toMatchObject(expected);
});
