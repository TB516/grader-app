import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
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
  const result = await Effect.runPromise(runGrader(new URL(goodDankmemesImageUrl), dankmemesImageGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badDankmemesImageUrl), dankmemesImageGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the image body is empty', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(emptyDankmemesImageUrl), dankmemesImageGrader));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'image/png'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badContentTypeDankmemesImageUrl), dankmemesImageGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(httpErrorDankmemesImageUrl), dankmemesImageGrader));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(networkErrorDankmemesImageUrl), dankmemesImageGrader));

  expect(result).toMatchObject(expected);
});
