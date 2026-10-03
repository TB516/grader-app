import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { streamingMediaGraders } from '../../../../../src/main/projects/streaming-media';
import { server } from '../mocks';
import { goodStreamingMediaUrl } from '../mocks/media-handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test.each([200, 206, 416, 500])('A request without Range handles status %i according to the rubric', async (status) => {
  server.use(
    http.get(`${goodStreamingMediaUrl}/party.mp4`, ({ request }) => {
      if (request.headers.has('Range')) return undefined;
      return new HttpResponse(null, {
        status,
        headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 0-99/100', 'Accept-Ranges': 'bytes' }
      });
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(goodStreamingMediaUrl), streamingMediaGraders['party-video']))).toMatchObject({
    status: status === 500 ? 'fail' : 'pass'
  });
});

test.each([
  ['party-video', 'party.mp4'],
  ['bling-audio', 'bling.mp3'],
  ['bird-video', 'bird.mp4']
] as const)('%s rejects a server that only supports the first chunk', async (check, path) => {
  server.use(
    http.get(`${goodStreamingMediaUrl}/${path}`, ({ request }) => {
      if (request.headers.get('Range') !== 'bytes=0-15') return new HttpResponse(null, { status: 416 });
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(goodStreamingMediaUrl), streamingMediaGraders[check]))).toMatchObject({ status: 'fail' });
});

test.each(['wrong bytes', 'wrong byte count', 'wrong total', 'bad content length'])('Rejects seeking with %s', async (problem) => {
  server.use(
    http.get(`${goodStreamingMediaUrl}/party.mp4`, ({ request }) => {
      if (request.headers.get('Range') !== 'bytes=4-15') return undefined;
      const bytes = new Uint8Array([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]);
      if (problem === 'wrong bytes') bytes[0] = 0;
      const body = problem === 'wrong byte count' ? bytes.slice(0, 8) : bytes;
      return new HttpResponse(body, {
        status: 206,
        headers: {
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes 4-15/${problem === 'wrong total' ? 200 : 100}`,
          'Content-Length': problem === 'bad content length' ? '12junk' : String(body.length)
        }
      });
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(goodStreamingMediaUrl), streamingMediaGraders['party-video']))).toMatchObject({ status: 'fail' });
});
