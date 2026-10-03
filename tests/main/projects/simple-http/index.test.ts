import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { gradingRun } from '../../../../src/main/grading-run';
import { projectRouter } from '../../../../src/main/project-router';
import type { GradingEvent } from '../../../../src/shared/types';
import { server } from './mocks';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Simple HTTP runs its checks through the application registry', async () => {
  const events: GradingEvent[] = [];
  const { graders, url } = Effect.runSync(projectRouter({ assignment: 'Simple HTTP', url: 'https://good.simple-http.com/' }));
  await Effect.runPromise(gradingRun('test-run', url, graders, (event) => events.push(event)));

  expect(events[0].type).toBe('started');
  const results = events.filter((event) => event.type === 'result');
  expect(results).toHaveLength(Object.keys(graders).length);
  expect(results.every((event) => event.check.result?.status === 'pass')).toBe(true);
  expect(events.at(-1)).toEqual({ runId: 'test-run', type: 'finished', outcome: 'completed' });
});
