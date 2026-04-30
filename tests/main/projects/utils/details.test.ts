import { expect, test } from 'vitest';
import { errorDetails, responseDetails } from '../../../../src/main/projects/utils/details';

test('responseDetails includes response fields that JSON.stringify omits', () => {
  const response = new Response('Not found', {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'Content-Type': 'text/plain'
    }
  });

  const details = JSON.parse(responseDetails(response));

  expect(JSON.stringify(response)).toBe('{}');
  expect(details).toMatchObject({
    status: 404,
    statusText: 'Not Found',
    ok: false,
    bodyUsed: false,
    headers: {
      'content-type': 'text/plain'
    }
  });
});

test('errorDetails includes error fields that JSON.stringify omits', () => {
  const error = new Error('Network failed');
  const details = JSON.parse(errorDetails(error));

  expect(JSON.stringify(error)).toBe('{}');
  expect(details).toMatchObject({
    name: 'Error',
    message: 'Network failed'
  });
  expect(details.stack).toContain('Network failed');
});
