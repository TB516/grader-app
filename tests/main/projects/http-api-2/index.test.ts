import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { httpApi2Runner } from '../../../../src/main/projects/http-api-2';
import { indexPageGrader } from '../../../../src/main/projects/http-api-2/graders/index-page';
import { server } from './mocks';
import { goodHttpApi2Url, resetGoodHttpApi2Users } from './mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => {
  resetGoodHttpApi2Users();
  server.resetHandlers();
});
afterAll(() => server.close());

test('Runner returns the full grader list and streams results', async () => {
  const send = vi.fn();
  const done = vi.fn();

  const runs = httpApi2Runner(new URL(goodHttpApi2Url), send, done);

  expect(runs).toEqual([
    { label: 'Home Page Returns HTML', result: null },
    { label: 'Style CSS Returns text/css', result: null },
    { label: '/getUsers GET Returns Users JSON', result: null },
    { label: '/getUsers HEAD Returns 200 Without Body', result: null },
    { label: '/notReal GET Returns JSON 404', result: null },
    { label: '/notReal HEAD Returns 404 Without Body', result: null },
    { label: 'Unknown Routes Return 404', result: null },
    { label: '/addUser POST Creates Updates And Validates Users', result: null }
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

  httpApi2Runner(new URL(`${goodHttpApi2Url}/`), send, done);

  await vi.waitFor(() => {
    expect(send).toHaveBeenCalledTimes(8);
    expect(done).toHaveBeenCalledTimes(1);
  });

  for (const call of send.mock.calls) {
    expect(call[0].result.status).toBe('pass');
  }
});

test('Runner reports an unexpected grader exception and still completes', async () => {
  const send = vi.fn();
  const done = vi.fn();
  const spy = vi.spyOn(indexPageGrader, 'run').mockRejectedValueOnce(new Error('Unexpected failure'));
  try {
    const pending = httpApi2Runner(new URL(goodHttpApi2Url), send, done);
    await vi.waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(send).toHaveBeenCalledTimes(pending.length);
    expect(send).toHaveBeenCalledWith({
      label: indexPageGrader.label,
      result: { status: 'error', message: expect.any(String), details: expect.stringContaining('Unexpected failure') }
    });
  } finally {
    spy.mockRestore();
  }
});
