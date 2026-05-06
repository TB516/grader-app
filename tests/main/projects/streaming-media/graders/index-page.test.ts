import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { indexPageGrader } from '../../../../../src/main/projects/streaming-media/graders/index-page';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badStreamingMediaBaseUrl,
  emptyStreamingMediaBaseUrl,
  goodStreamingMediaBaseUrl,
  httpErrorStreamingMediaBaseUrl,
  networkErrorStreamingMediaBaseUrl
} from '../mocks/page-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(goodStreamingMediaBaseUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad assignment', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(badStreamingMediaBaseUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the HTML body is empty', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(emptyStreamingMediaBaseUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(httpErrorStreamingMediaBaseUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await indexPageGrader.run(new URL(networkErrorStreamingMediaBaseUrl));

  expect(result).toMatchObject(expected);
});
