import { Effect } from 'effect';
import { afterEach, expect, test, vi } from 'vitest';
import { gradingRun } from '../../src/main/grading-run';
import type { Grader } from '../../src/main/types';
import type { GradingEvent } from '../../src/shared/types';

const url = new URL('https://example.com');
afterEach(() => vi.useRealTimers());

test('Reports expected failures and defects, keeps other checks running, and finishes once', async () => {
  const events: GradingEvent[] = [];
  const graders: Record<string, Grader> = {
    throws: {
      label: 'Shared label',
      run: () => {
        throw new Error('Thrown failure');
      }
    },
    rejects: {
      label: 'Shared label',
      run: () =>
        Effect.promise(async () => {
          throw new Error('Rejected failure');
        })
    },
    fails: { label: 'Invalid response', run: () => Effect.fail({ status: 'fail', message: 'Missing required message' }) },
    passes: { label: 'Working', run: () => Effect.succeed({ status: 'pass', message: 'OK' }) }
  };
  await Effect.runPromise(gradingRun('run', url, graders, (event) => events.push(event)));
  expect(events[0]).toMatchObject({
    type: 'started',
    checks: [
      { id: 'throws', result: null },
      { id: 'rejects', result: null },
      { id: 'fails', result: null },
      { id: 'passes', result: null }
    ]
  });
  const results = events.filter((event) => event.type === 'result');
  expect(results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        check: expect.objectContaining({
          id: 'throws',
          result: expect.objectContaining({ status: 'error', details: expect.stringContaining('Thrown failure') })
        })
      }),
      expect.objectContaining({
        check: expect.objectContaining({
          id: 'rejects',
          result: expect.objectContaining({ status: 'error', details: expect.stringContaining('Rejected failure') })
        })
      }),
      expect.objectContaining({
        check: expect.objectContaining({ id: 'fails', result: { status: 'fail', message: 'Missing required message' } })
      }),
      expect.objectContaining({ check: expect.objectContaining({ id: 'passes', result: { status: 'pass', message: 'OK' } }) })
    ])
  );
  expect(events.filter((event) => event.type === 'finished')).toEqual([{ type: 'finished', runId: 'run', outcome: 'completed' }]);
});

test('Cancellation aborts active checks, leaves queued checks unstarted, and ignores late results', async () => {
  const controller = new AbortController();
  const events: GradingEvent[] = [];
  const signals: AbortSignal[] = [];
  const finishers: (() => void)[] = [];
  const run: Grader['run'] = () =>
    Effect.promise((signal) => {
      signals.push(signal);
      return new Promise((resolve) => finishers.push(() => resolve({ status: 'pass', message: 'Too late' })));
    });
  const graders = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [String(index), { label: 'Check', run }]));
  const execution = Effect.runPromiseExit(
    gradingRun('run', url, graders, (event) => events.push(event)),
    { signal: controller.signal }
  );
  await vi.waitFor(() => expect(signals).toHaveLength(4));
  controller.abort();
  await execution;
  expect(signals.every((signal) => signal.aborted)).toBe(true);
  expect(events.filter((event) => event.type === 'result').map((event) => event.check.result?.status)).toEqual(Array(6).fill('cancelled'));
  expect(events.at(-1)).toMatchObject({ type: 'finished', outcome: 'cancelled' });
  const eventCount = events.length;
  finishers.forEach((finish) => finish());
  await Promise.resolve();
  expect(events).toHaveLength(eventCount);
  expect(signals).toHaveLength(4);
});

test('A stuck check times out and aborts its work while the run completes', async () => {
  vi.useFakeTimers();
  const events: GradingEvent[] = [];
  let checkSignal: AbortSignal | undefined;
  const execution = Effect.runPromise(
    gradingRun(
      'run',
      url,
      {
        stuck: {
          label: 'Stuck',
          run: () =>
            Effect.promise((signal) => {
              checkSignal = signal;
              return new Promise(() => {});
            })
        },
        fast: { label: 'Fast', run: () => Effect.succeed({ status: 'pass', message: 'OK' }) }
      },
      (event) => events.push(event)
    )
  );
  await vi.advanceTimersByTimeAsync(60_001);
  await execution;
  expect(checkSignal?.aborted).toBe(true);
  expect(events).toContainEqual(
    expect.objectContaining({ type: 'result', check: expect.objectContaining({ id: 'stuck', result: expect.objectContaining({ status: 'error' }) }) })
  );
  expect(events.at(-1)).toMatchObject({ type: 'finished', outcome: 'completed' });
});
