import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { dankmemesImageGrader } from '../../../../../src/main/projects/simple-http/graders/dankmemes-image';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badContentTypeDankmemesImageUrl,
  badDankmemesImageUrl,
  emptyDankmemesImageUrl,
  goodDankmemesImageUrl,
  httpErrorDankmemesImageUrl,
  networkErrorDankmemesImageUrl
} from '../mocks/dankmemes-image-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await dankmemesImageGrader.run(new URL(goodDankmemesImageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await dankmemesImageGrader.run(new URL(badDankmemesImageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the image body is empty', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await dankmemesImageGrader.run(new URL(emptyDankmemesImageUrl));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'image/png'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await dankmemesImageGrader.run(new URL(badContentTypeDankmemesImageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await dankmemesImageGrader.run(new URL(httpErrorDankmemesImageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await dankmemesImageGrader.run(new URL(networkErrorDankmemesImageUrl));

  expect(result).toMatchObject(expected);
});
