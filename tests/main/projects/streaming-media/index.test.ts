import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { streamingMediaRunner } from '../../../../src/main/projects/streaming-media';
import { server } from './mocks';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Runner returns the full grader list and streams results', async () => {
  const send = vi.fn();
  const done = vi.fn();

  const runs = streamingMediaRunner(new URL('https://good.streaming-media.com'), send, done);

  expect(runs).toEqual([
    { label: 'Index Page Returns HTML', result: null },
    { label: 'Page 2 Returns HTML', result: null },
    { label: 'Page 3 Returns HTML', result: null },
    { label: 'Party MP4 Supports Range Streaming', result: null },
    { label: 'Bling MP3 Supports Range Streaming', result: null },
    { label: 'Bird MP4 Supports Range Streaming', result: null }
  ]);

  await vi.waitFor(() => {
    expect(send).toHaveBeenCalledTimes(6);
    expect(done).toHaveBeenCalledTimes(1);
  });

  for (const call of send.mock.calls) {
    expect(call[0]).toMatchObject({
      label: expect.any(String),
      result: { status: expect.stringMatching(/pass|fail|error/), message: expect.any(String) }
    });
  }
});

test('Runner accepts project URLs with a trailing slash', async () => {
  const send = vi.fn();
  const done = vi.fn();

  streamingMediaRunner(new URL('https://good.streaming-media.com/'), send, done);

  await vi.waitFor(() => {
    expect(send).toHaveBeenCalledTimes(6);
    expect(done).toHaveBeenCalledTimes(1);
  });

  for (const call of send.mock.calls) {
    expect(call[0].result.status).toBe('pass');
  }
});
