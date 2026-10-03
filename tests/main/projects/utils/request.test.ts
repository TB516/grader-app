import { createServer } from 'node:http';
import { Effect } from 'effect';
import { expect, test } from 'vitest';
import { gradingRun } from '../../../../src/main/grading-run';
import { jsonDefaultGrader } from '../../../../src/main/projects/http-api-1/graders/json-default';
import { indexPageGrader } from '../../../../src/main/projects/simple-http/graders/index-page';
import type { GradingEvent } from '../../../../src/shared/types';

test.each([
  ['fetch body', indexPageGrader, 'text/html'],
  ['absent-Accept request', jsonDefaultGrader, 'application/json']
] as const)('Cancelling a run closes the real HTTP connection during %s', async (_name, grader, contentType) => {
  const received = Promise.withResolvers<void>();
  const closed = Promise.withResolvers<void>();
  const server = createServer((_request, response) => {
    response.on('close', () => closed.resolve());
    response.writeHead(200, { 'Content-Type': contentType });
    response.write('unfinished body');
    received.resolve();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const controller = new AbortController();
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');
    const events: GradingEvent[] = [];
    const execution = Effect.runPromiseExit(
      gradingRun('run', new URL(`http://127.0.0.1:${address.port}`), { check: grader }, (event) => events.push(event)),
      { signal: controller.signal }
    );
    await received.promise;
    controller.abort();
    await execution;
    await closed.promise;
    expect(events.at(-1)).toMatchObject({ type: 'finished', outcome: 'cancelled' });
    expect(events.filter((event) => event.type === 'result')[0].check.result?.status).toBe('cancelled');
  } finally {
    controller.abort();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('An early verdict closes an unread response body when the check finishes', async () => {
  const closed = Promise.withResolvers<void>();
  const server = createServer((_request, response) => {
    response.on('close', () => closed.resolve());
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.write('A wrong content type with a body that never ends');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');
    const events: GradingEvent[] = [];
    await Effect.runPromise(
      gradingRun('run', new URL(`http://127.0.0.1:${address.port}`), { index: indexPageGrader }, (event) => events.push(event))
    );
    await closed.promise;
    expect(events.filter((event) => event.type === 'result')[0].check.result?.status).toBe('fail');
    expect(events.at(-1)).toMatchObject({ type: 'finished', outcome: 'completed' });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
