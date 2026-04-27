import { expect, test } from 'vitest';
import { projectUrl } from '../../../../src/main/projects/utils/project-url';

test.each([
  ['https://good.simple-http.com', '/dankmemes', 'https://good.simple-http.com/dankmemes'],
  ['https://good.simple-http.com/', '/dankmemes', 'https://good.simple-http.com/dankmemes'],
  ['https://good.simple-http.com/base', '/dankmemes', 'https://good.simple-http.com/base/dankmemes'],
  ['https://good.simple-http.com/base/', '/dankmemes', 'https://good.simple-http.com/base/dankmemes'],
  ['https://good.simple-http.com///', '/dankmemes', 'https://good.simple-http.com///dankmemes'],
  ['https://good.simple-http.com/base', 'dankmemes', 'https://good.simple-http.com/base/dankmemes'],
  ['https://good.simple-http.com/base', '/login?username=test', 'https://good.simple-http.com/base/login?username=test'],
  ['https://good.simple-http.com/base/', '/login?username=test#form', 'https://good.simple-http.com/base/login?username=test#form'],
  ['https://good.simple-http.com/base?token=abc#section', '/dankmemes', 'https://good.simple-http.com/base/dankmemes'],
  ['https://good.simple-http.com/base/?token=abc#section', '/dankmemes', 'https://good.simple-http.com/base/dankmemes'],
  ['https://good.simple-http.com/base', '?username=test', 'https://good.simple-http.com/base/?username=test']
])('projectUrl(%s, %s) returns %s', (baseUrl, path, expected) => {
  expect(projectUrl(new URL(baseUrl), path).toString()).toBe(expected);
});
