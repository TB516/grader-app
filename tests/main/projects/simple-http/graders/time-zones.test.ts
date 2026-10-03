import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Temporal } from 'temporal-polyfill';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { timeJsonGrader } from '../../../../../src/main/projects/simple-http/graders/time-json';
import { timeTextGrader } from '../../../../../src/main/projects/simple-http/graders/time-text';

const url = new URL('https://submission.example/');
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

test.each(['America/New_York', 'Asia/Kathmandu', 'Pacific/Auckland'])('Accepts current server time in %s for text and JSON', async (zone) => {
  server.use(
    http.get(`${url}time`, () => HttpResponse.text(Temporal.Now.plainTimeISO(zone).toString())),
    http.get(`${url}timeJSON`, () => HttpResponse.json({ time: Temporal.Now.plainTimeISO(zone).toString(), extra: 'allowed' }))
  );
  for (const grader of [timeTextGrader, timeJsonGrader]) expect(await Effect.runPromise(runGrader(url, grader))).toMatchObject({ status: 'pass' });
});

test('Allows clock tolerance across midnight and rejects empty time components', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-03T00:00:01Z'));
  server.use(http.get(`${url}time`, () => HttpResponse.text('23:59:59')));
  expect(await Effect.runPromise(runGrader(url, timeTextGrader))).toMatchObject({ status: 'pass' });
  server.use(http.get(`${url}time`, () => HttpResponse.text(':0:1')));
  expect(await Effect.runPromise(runGrader(url, timeTextGrader))).toMatchObject({ status: 'fail', message: expect.stringContaining('parse') });
});
