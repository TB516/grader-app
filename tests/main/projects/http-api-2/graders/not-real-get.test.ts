import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { notRealGetGrader } from '../../../../../src/main/projects/http-api-2/graders/not-real-get';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badNotRealGetContentTypeUrl, badNotRealGetShapeUrl, badNotRealGetStatusUrl, goodHttpApi2Url } from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await notRealGetGrader.run(new URL(goodHttpApi2Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 404 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await notRealGetGrader.run(new URL(badNotRealGetStatusUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails JSON without an error id', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await notRealGetGrader.run(new URL(badNotRealGetShapeUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad content type', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await notRealGetGrader.run(new URL(badNotRealGetContentTypeUrl));

  expect(result).toMatchObject(expected);
});
