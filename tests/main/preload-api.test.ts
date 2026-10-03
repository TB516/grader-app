import { ipcRenderer } from 'electron';
import { expect, test, vi } from 'vitest';
import { gradeProject } from '../../src/preload/api';
import type { GradingEvent, GradingRequest } from '../../src/shared/types';

vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events');
  return { ipcRenderer: Object.assign(new EventEmitter(), { send: vi.fn() }) };
});

test('Subscribes before a fast run starts, ignores other runs, and cancels on cleanup', () => {
  const request: GradingRequest = { runId: 'current-run', assignment: 'Simple HTTP', url: 'https://example.com' };
  const events: GradingEvent[] = [
    { runId: request.runId, type: 'started', checks: [{ id: 'index', label: 'Index', result: null }] },
    { runId: request.runId, type: 'result', check: { id: 'index', label: 'Index', result: { status: 'pass', message: 'OK' } } },
    { runId: request.runId, type: 'finished', outcome: 'completed' }
  ];
  vi.mocked(ipcRenderer.send).mockImplementation((channel) => {
    if (channel !== 'grader:start') return;
    ipcRenderer.emit('grader:event', {}, { runId: 'old-run', type: 'finished', outcome: 'cancelled' });
    for (const event of events) ipcRenderer.emit('grader:event', {}, event);
  });
  const received: GradingEvent[] = [];
  const cleanup = gradeProject(request, (event) => received.push(event));
  expect(received).toEqual(events);
  cleanup();
  expect(ipcRenderer.listenerCount('grader:event')).toBe(0);
  expect(ipcRenderer.send).toHaveBeenLastCalledWith('grader:cancel', request.runId);
});
