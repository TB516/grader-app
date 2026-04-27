import { beforeEach, expect, test, vi } from 'vitest';
import { projectRouter } from '../../src/main/project-router';
import { simpleHttpRunner } from '../../src/main/projects/simple-http';
import { projects } from '../../src/shared/projects';

vi.mock('../../src/main/projects/simple-http', () => ({
  simpleHttpRunner: vi.fn(() => [])
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const event = {
  sender: {
    send: vi.fn()
  }
} as unknown as Electron.IpcMainInvokeEvent;

test.each(projects)('Router passes the project URL through for %s', (assignment) => {
  projectRouter(event, assignment, 'https://good.simple-http.com/');

  const url = vi.mocked(simpleHttpRunner).mock.calls[0][0];

  expect(url).toBeInstanceOf(URL);
  expect(url.toString()).toBe('https://good.simple-http.com/');
  expect(simpleHttpRunner).toHaveBeenCalledWith(url, expect.any(Function), expect.any(Function));
});
