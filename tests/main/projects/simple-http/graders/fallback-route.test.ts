import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { fallbackRouteGrader } from '../../../../../src/main/projects/simple-http/graders/fallback-route';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badContentTypeFallbackRouteUrl,
  badFallbackRouteUrl,
  goodFallbackRouteUrl,
  httpErrorFallbackRouteUrl,
  networkErrorFallbackRouteUrl
} from '../mocks/fallback-route-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await fallbackRouteGrader.run(new URL(goodFallbackRouteUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await fallbackRouteGrader.run(new URL(badFallbackRouteUrl));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'text/html'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await fallbackRouteGrader.run(new URL(badContentTypeFallbackRouteUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await fallbackRouteGrader.run(new URL(httpErrorFallbackRouteUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await fallbackRouteGrader.run(new URL(networkErrorFallbackRouteUrl));

  expect(result).toMatchObject(expected);
});
