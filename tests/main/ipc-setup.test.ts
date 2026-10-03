import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Effect } from 'effect';
import { ipcMain } from 'electron';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setupIPC } from '../../src/main/ipc-setup';
import { simpleHttpGraders } from '../../src/main/projects/simple-http';
import type { GradingEvent } from '../../src/shared/types';

vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events');
  return { ipcMain: Object.assign(new EventEmitter(), { handle: vi.fn() }) };
});
vi.mock('../../src/main/create-window', () => ({ createWindow: vi.fn() }));

class ResultsWindow extends EventEmitter {
  destroyed = false;
  events: GradingEvent[] = [];
  constructor(readonly id: number) {
    super();
  }
  isDestroyed = (): boolean => this.destroyed;
  send = (_channel: string, event: GradingEvent): void => {
    this.events.push(event);
  };
}

const windows: ResultsWindow[] = [];
const signals: AbortSignal[] = [];
const start = (sender: ResultsWindow, runId = randomUUID()): string => {
  ipcMain.emit('grader:start', { sender }, { runId, assignment: 'Simple HTTP', url: 'https://example.com/' });
  return runId;
};

beforeEach(() => {
  setupIPC();
  for (const grader of Object.values(simpleHttpGraders)) {
    vi.spyOn(grader, 'run').mockImplementation(() =>
      Effect.promise((signal) => {
        signals.push(signal);
        return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
      })
    );
  }
});
afterEach(async () => {
  for (const sender of windows) {
    sender.destroyed = true;
    sender.emit('destroyed');
  }
  await vi.waitFor(() => expect(signals.every((signal) => signal.aborted)).toBe(true));
  windows.length = 0;
  signals.length = 0;
  ipcMain.removeAllListeners();
  vi.restoreAllMocks();
});

test('Cancellation belongs to the requesting window and run; a replacement run cancels the previous one', async () => {
  const sender = new ResultsWindow(1);
  const other = new ResultsWindow(2);
  windows.push(sender, other);
  const first = start(sender);
  await vi.waitFor(() => expect(signals).toHaveLength(4));
  ipcMain.emit('grader:cancel', { sender: other }, first);
  ipcMain.emit('grader:cancel', { sender }, randomUUID());
  expect(signals.every((signal) => !signal.aborted)).toBe(true);

  const second = start(sender);
  await vi.waitFor(() => expect(signals).toHaveLength(8));
  expect(signals.slice(0, 4).every((signal) => signal.aborted)).toBe(true);
  expect(signals.slice(4).every((signal) => !signal.aborted)).toBe(true);
  ipcMain.emit('grader:cancel', { sender }, first);
  expect(signals.slice(4).every((signal) => !signal.aborted)).toBe(true);
  ipcMain.emit('grader:cancel', { sender }, second);
  await vi.waitFor(() => expect(sender.events.filter((event) => event.type === 'finished')).toHaveLength(2));
  await vi.waitFor(() => expect(sender.listenerCount('destroyed')).toBe(0));
  expect(sender.listenerCount('did-start-navigation')).toBe(0);
});

test.each(['close', 'reload'] as const)('%s aborts active requests and removes window listeners', async (action) => {
  const sender = new ResultsWindow(1);
  windows.push(sender);
  start(sender);
  await vi.waitFor(() => expect(signals).toHaveLength(4));
  if (action === 'close') {
    sender.destroyed = true;
    sender.emit('destroyed');
  } else {
    sender.emit('did-start-navigation', {}, 'https://example.com', false, true);
  }
  await vi.waitFor(() => expect(signals.every((signal) => signal.aborted)).toBe(true));
  await vi.waitFor(() => expect(sender.listenerCount('did-start-navigation')).toBe(0));
  if (action === 'close')
    expect(sender.events).toHaveLength(1); // No sends to a destroyed window.
  else expect(sender.events.at(-1)).toMatchObject({ type: 'finished', outcome: 'cancelled' });
});

test('Invalid input returns a terminal event without starting checks', () => {
  const sender = new ResultsWindow(1);
  const runId = randomUUID();
  ipcMain.emit('grader:start', { sender }, { runId, assignment: 'Simple HTTP', url: 12 });
  expect(sender.events).toEqual([expect.objectContaining({ type: 'finished', runId, outcome: 'error' })]);
  expect(signals).toHaveLength(0);
});
