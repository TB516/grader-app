import { beforeEach, expect, test, vi } from 'vitest';
import { projectRouter } from '../../src/main/project-router';
import { httpApi1Runner } from '../../src/main/projects/http-api-1';
import { httpApi2Runner } from '../../src/main/projects/http-api-2';
import { simpleHttpRunner } from '../../src/main/projects/simple-http';
import { streamingMediaRunner } from '../../src/main/projects/streaming-media';
import { projects } from '../../src/shared/projects';

vi.mock('../../src/main/projects/http-api-1', () => ({ httpApi1Runner: vi.fn(() => []) }));
vi.mock('../../src/main/projects/http-api-2', () => ({ httpApi2Runner: vi.fn(() => []) }));

vi.mock('../../src/main/projects/simple-http', () => ({
  simpleHttpRunner: vi.fn(() => [])
}));

vi.mock('../../src/main/projects/streaming-media', () => ({
  streamingMediaRunner: vi.fn(() => [])
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const event = {
  sender: {
    send: vi.fn()
  }
} as unknown as Electron.IpcMainInvokeEvent;

test.each(projects.filter((project) => !['Streaming Media', 'HTTP API I', 'HTTP API II'].includes(project)))(
  'Router passes the project URL through for %s',
  (assignment) => {
    projectRouter(event, assignment, 'https://good.simple-http.com/');

    const url = vi.mocked(simpleHttpRunner).mock.calls[0][0];

    expect(url).toBeInstanceOf(URL);
    expect(url.toString()).toBe('https://good.simple-http.com/');
    expect(simpleHttpRunner).toHaveBeenCalledWith(url, expect.any(Function), expect.any(Function));
    expect(streamingMediaRunner).not.toHaveBeenCalled();
  }
);

test('Router sends Streaming Media to the streaming media runner', () => {
  projectRouter(event, 'Streaming Media', 'https://good.streaming-media.com/');

  const url = vi.mocked(streamingMediaRunner).mock.calls[0][0];

  expect(url).toBeInstanceOf(URL);
  expect(url.toString()).toBe('https://good.streaming-media.com/');
  expect(streamingMediaRunner).toHaveBeenCalledWith(url, expect.any(Function), expect.any(Function));
  expect(simpleHttpRunner).not.toHaveBeenCalled();
});

test.each([
  ['HTTP API I', httpApi1Runner],
  ['HTTP API II', httpApi2Runner]
] as const)('Router selects the correct runner for %s', (assignment, runner) => {
  projectRouter(event, assignment, 'https://assignment.example/course/');
  expect(runner).toHaveBeenCalledWith(new URL('https://assignment.example/course/'), expect.any(Function), expect.any(Function));
  expect(simpleHttpRunner).not.toHaveBeenCalled();
  expect(streamingMediaRunner).not.toHaveBeenCalled();
});
