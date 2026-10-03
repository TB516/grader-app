import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte/pure';
import Home from '../../src/renderer/src/pages/Home.svelte';
import type { ProjectTypes } from '../../src/shared/types';

const available: ProjectTypes[] = ['Simple HTTP', 'Streaming Media', 'HTTP API I', 'HTTP API II', 'Simple Models'];

beforeEach(() => {
  vi.stubGlobal('api', {
    availableProjects: vi.fn<Window['api']['availableProjects']>().mockResolvedValue(available),
    launchTester: vi.fn<Window['api']['launchTester']>().mockResolvedValue(undefined),
    gradeProject: vi.fn<Window['api']['gradeProject']>(),
    cancelGrading: vi.fn<Window['api']['cancelGrading']>()
  } satisfies Window['api']);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('Shows loading until assignments arrive, then disables unsupported assignments without refetching', async () => {
  const loading = Promise.withResolvers<ProjectTypes[]>();
  vi.mocked(window.api.availableProjects).mockReturnValueOnce(loading.promise);
  const screen = await render(Home);
  await expect.element(screen.getByRole('status', { name: 'Loading graders' })).toBeVisible();
  loading.resolve(available);
  const submit = screen.getByRole('button', { name: 'Run Tests' });
  await expect.element(submit).toBeEnabled();
  await screen.getByRole('button', { name: 'Domomaker C' }).click();
  await expect.element(submit).toBeDisabled();
  await expect.element(screen.getByText('The grader for this assignment is not available yet.')).toBeVisible();
  await screen.getByRole('button', { name: 'Simple Models' }).click();
  await expect.element(submit).toBeEnabled();
  await expect.element(screen.getByText('Test records remain in the database.', { exact: false })).toBeVisible();
  expect(window.api.availableProjects).toHaveBeenCalledOnce();
});

test('A failed assignment load can be retried through the boundary', async () => {
  vi.mocked(window.api.availableProjects).mockRejectedValueOnce(new Error('IPC unavailable'));
  const screen = await render(Home);
  await expect.element(screen.getByRole('alert')).toHaveTextContent('The assignment list could not be loaded. Try again.');
  await screen.getByRole('button', { name: 'Try again' }).click();
  await expect.element(screen.getByRole('button', { name: 'Run Tests' })).toBeEnabled();
  expect(window.api.availableProjects).toHaveBeenCalledTimes(2);
});

test('Opening a window disables repeat submissions and recovers from a launch failure', async () => {
  const opening = Promise.withResolvers<void>();
  vi.mocked(window.api.launchTester).mockReturnValueOnce(opening.promise);
  const screen = await render(Home);
  await screen.getByRole('textbox', { name: 'Project URL' }).fill('https://example.com/course/');
  await screen.getByRole('button', { name: 'Run Tests' }).click();
  await expect.element(screen.getByRole('button', { name: 'Opening…' })).toBeDisabled();
  opening.reject(new Error('Internal IPC error'));
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Unable to open the grading window. Check the project URL and try again.');
  await screen.getByRole('button', { name: 'Run Tests' }).click();
  await expect.element(screen.getByRole('button', { name: 'Run Tests' })).toBeEnabled();
  expect(window.api.launchTester).toHaveBeenCalledTimes(2);
  expect(window.api.launchTester).toHaveBeenLastCalledWith('Simple HTTP', 'https://example.com/course/');
});
