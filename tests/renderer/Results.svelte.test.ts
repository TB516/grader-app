import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte/pure';
import Results from '../../src/renderer/src/pages/Results.svelte';

const originalUrl = window.location.href;

beforeEach(() => {
  const url = new URL(originalUrl);
  url.searchParams.set('assignment', 'Simple HTTP');
  url.searchParams.set('url', 'https://example.com/');
  history.replaceState(null, '', url);
  vi.stubGlobal('api', {
    availableProjects: vi.fn<Window['api']['availableProjects']>(),
    launchTester: vi.fn<Window['api']['launchTester']>(),
    gradeProject: vi.fn<Window['api']['gradeProject']>().mockReturnValue(vi.fn()),
    cancelGrading: vi.fn<Window['api']['cancelGrading']>()
  } satisfies Window['api']);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  history.replaceState(null, '', originalUrl);
});

test('Fast result events keep separate rows with the same label and update the derived summary', async () => {
  vi.mocked(window.api.gradeProject).mockImplementation(({ runId }, emit) => {
    emit({
      runId,
      type: 'started',
      checks: [
        { id: 'first', label: 'Response', result: null },
        { id: 'second', label: 'Response', result: null }
      ]
    });
    emit({ runId, type: 'result', check: { id: 'first', label: 'Response', result: { status: 'pass', message: 'HTML returned' } } });
    emit({ runId, type: 'result', check: { id: 'second', label: 'Response', result: { status: 'fail', message: 'Missing JSON' } } });
    emit({ runId, type: 'finished', outcome: 'completed' });
    return vi.fn();
  });
  const screen = await render(Results);
  await expect.element(screen.getByText('HTML returned')).toBeVisible();
  await expect.element(screen.getByText('Missing JSON')).toBeVisible();
  const summary = screen.getByRole('region', { name: 'Grading summary' });
  await expect.element(summary).toHaveTextContent(/Total\s*2\s*Complete\s*2\s*Passed\s*1\s*Failed\s*1\s*Errors\s*0\s*Pending\s*0/);
  await expect.element(screen.getByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
});

test('Cancellation updates the counts and unmounting releases the subscription', async () => {
  const unsubscribe = vi.fn();
  vi.mocked(window.api.gradeProject).mockReturnValue(unsubscribe);
  const screen = await render(Results);
  await vi.waitFor(() => expect(window.api.gradeProject).toHaveBeenCalledOnce());
  const [{ runId }, emit] = vi.mocked(window.api.gradeProject).mock.calls[0];
  emit({ runId, type: 'started', checks: [{ id: 'slow', label: 'Slow response', result: null }] });
  await screen.getByRole('button', { name: 'Cancel' }).click();
  expect(window.api.cancelGrading).toHaveBeenCalledWith(runId);
  emit({ runId, type: 'result', check: { id: 'slow', label: 'Slow response', result: { status: 'cancelled', message: 'Grading cancelled.' } } });
  emit({ runId, type: 'finished', outcome: 'cancelled' });
  await expect
    .element(screen.getByRole('region', { name: 'Grading summary' }))
    .toHaveTextContent(/Total\s*1\s*Complete\s*0.*Pending\s*0\s*Cancelled\s*1/);
  await expect.element(screen.getByRole('status', { name: 'Waiting for grader result' })).not.toBeInTheDocument();
  await screen.unmount();
  expect(unsubscribe).toHaveBeenCalledOnce();
});
