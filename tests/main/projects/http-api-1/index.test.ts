import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { httpApi1Runner } from '../../../../src/main/projects/http-api-1';
import { homePageGrader } from '../../../../src/main/projects/http-api-1/graders/home-page';
import { server } from './mocks';
import { goodHttpApi1InternalErrorUrl, goodHttpApi1Url } from './mocks/http-api-1-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Runner returns the full grader list and streams results', async () => {
  const send = vi.fn();
  const done = vi.fn();

  const runs = httpApi1Runner(new URL(goodHttpApi1Url), send, done);

  expect(runs).toEqual([
    { label: 'Home Page Returns HTML', result: null },
    { label: 'Style CSS Returns text/css', result: null },
    { label: 'API Defaults To JSON Without Accept Header', result: null },
    { label: 'API Returns JSON For application/json Accept Header', result: null },
    { label: 'API Returns XML For text/xml Accept Header', result: null }
  ]);

  await vi.waitFor(() => {
    expect(send).toHaveBeenCalledTimes(5);
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

  httpApi1Runner(new URL(`${goodHttpApi1InternalErrorUrl}/`), send, done);

  await vi.waitFor(() => {
    expect(send).toHaveBeenCalledTimes(5);
    expect(done).toHaveBeenCalledTimes(1);
  });

  for (const call of send.mock.calls) {
    expect(call[0].result.status).toBe('pass');
  }
});

test('Runner reports an unexpected grader exception and still completes', async () => {
  const send = vi.fn();
  const done = vi.fn();
  const spy = vi.spyOn(homePageGrader, 'run').mockRejectedValueOnce(new Error('Unexpected failure'));
  try {
    const pending = httpApi1Runner(new URL(goodHttpApi1Url), send, done);
    await vi.waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(send).toHaveBeenCalledTimes(pending.length);
    expect(send).toHaveBeenCalledWith({
      label: homePageGrader.label,
      result: { status: 'error', message: expect.any(String), details: expect.stringContaining('Unexpected failure') }
    });
  } finally {
    spy.mockRestore();
  }
});
