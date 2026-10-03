import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { jsonDefaultGrader } from '../../../../../src/main/projects/http-api-1/graders/json-default';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badJsonDefaultUrl, goodHttpApi1InternalErrorUrl, goodHttpApi1Url, networkErrorApiUrl } from '../mocks/http-api-1-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test.each(['*/*', 'text/html'])('Rejects a broken JSON default for Accept: %s', async (accept) => {
  server.use(
    http.get(`${goodHttpApi1Url}/success`, ({ request }) => {
      if (request.headers.get('Accept') === accept) return HttpResponse.xml('<response><message>Wrong format</message></response>');
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(goodHttpApi1Url), jsonDefaultGrader))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining(accept)
  });
});

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi1Url), jsonDefaultGrader));

  expect(result).toMatchObject(expected);
});

test('Grader passes assignment when /internal uses internalError id variant', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi1InternalErrorUrl), jsonDefaultGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if API does not default to JSON', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badJsonDefaultUrl), jsonDefaultGrader));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(networkErrorApiUrl), jsonDefaultGrader));

  expect(result).toMatchObject(expected);
});
