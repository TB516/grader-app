import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { simpleHttpRunner } from '../../../../src/main/projects/simple-http';
import { server } from './mocks';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Runner returns the full grader list and streams results', async () => {
  const send = vi.fn();
  const done = vi.fn();

  const runs = simpleHttpRunner(new URL('https://good.simple-http.com'), send, done);

  expect(runs).toEqual([
    { label: 'Index Page Returns HTML', result: null },
    { label: 'Page 2 Returns HTML', result: null },
    { label: 'Hello Endpoint Returns "Hello World"', result: null },
    { label: 'Time Endpoint Returns Correct Time', result: null },
    { label: 'Hello JSON Endpoint Returns {"message":"Hello World"}', result: null },
    { label: 'Time JSON Endpoint Returns Correct Time', result: null },
    { label: 'Dankmemes Endpoint Returns PNG', result: null },
    { label: 'Unknown Routes Match Index Page', result: null }
  ]);

  await vi.waitFor(() => {
    expect(send).toHaveBeenCalledTimes(8);
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

  simpleHttpRunner(new URL('https://good.simple-http.com/'), send, done);

  await vi.waitFor(() => {
    expect(send).toHaveBeenCalledTimes(8);
    expect(done).toHaveBeenCalledTimes(1);
  });

  for (const call of send.mock.calls) {
    expect(call[0].result.status).toBe('pass');
  }
});
