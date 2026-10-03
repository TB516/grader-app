import { Effect } from 'effect';
import { expect, test } from 'vitest';
import { availableProjects, projectRouter } from '../../src/main/project-router';

test('Only implemented projects are available; unsupported projects cannot run another assignment', () => {
  expect(availableProjects()).toEqual(['Simple HTTP', 'Streaming Media', 'HTTP API I', 'HTTP API II', 'Simple Models']);
  expect(() => Effect.runSync(projectRouter({ assignment: 'Domomaker C', url: 'https://example.com/' }))).toThrow('does not have a grader yet');
});

test.each(['file:///tmp/submission', 'javascript:alert(1)', 'ftp://example.com', 'not a URL', null])(
  'Rejects invalid project URL %s before running checks',
  (url) => {
    expect(() => Effect.runSync(projectRouter({ assignment: 'Simple HTTP', url }))).toThrow();
  }
);

test('Preserves deployment subpaths and rejects unknown assignments', () => {
  expect(Effect.runSync(projectRouter({ assignment: 'HTTP API II', url: 'https://example.com/course/' })).url.href).toBe(
    'https://example.com/course/'
  );
  expect(() => Effect.runSync(projectRouter({ assignment: 'unknown', url: 'https://example.com' }))).toThrow();
});
