import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { birdVideoGrader } from '../../../../../src/main/projects/streaming-media/graders/bird-video';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badAcceptRangesStreamingMediaUrl,
  badContentRangeStreamingMediaUrl,
  badContentTypeStreamingMediaUrl,
  badSignatureStreamingMediaUrl,
  emptyMediaStreamingMediaUrl,
  goodStreamingMediaUrl,
  http200StreamingMediaUrl,
  httpErrorMediaStreamingMediaUrl,
  networkErrorMediaStreamingMediaUrl
} from '../mocks/media-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the endpoint returns 200 instead of 206', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(http200StreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the content type is not video/mp4', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badContentTypeStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if Accept-Ranges is not bytes', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badAcceptRangesStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if Content-Range is malformed', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badContentRangeStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the media body is empty', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(emptyMediaStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the media signature is not MP4', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badSignatureStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 206 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(httpErrorMediaStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(networkErrorMediaStreamingMediaUrl), birdVideoGrader));

  expect(result).toMatchObject(expected);
});
