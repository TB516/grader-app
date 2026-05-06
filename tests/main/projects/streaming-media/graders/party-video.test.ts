import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { partyVideoGrader } from '../../../../../src/main/projects/streaming-media/graders/party-video';
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
  const result = await partyVideoGrader.run(new URL(goodStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the endpoint returns 200 instead of 206', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(http200StreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the content type is not video/mp4', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(badContentTypeStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if Accept-Ranges is not bytes', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(badAcceptRangesStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if Content-Range is malformed', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(badContentRangeStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the media body is empty', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(emptyMediaStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if the media signature is not MP4', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(badSignatureStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 206 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(httpErrorMediaStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await partyVideoGrader.run(new URL(networkErrorMediaStreamingMediaUrl));

  expect(result).toMatchObject(expected);
});
