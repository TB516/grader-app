import { Effect } from 'effect';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { styleCssGrader } from '../../../../../src/main/projects/http-api-2/graders/style-css';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badStyleCssUrl, emptyStyleCssUrl, goodHttpApi2Url, httpErrorStyleCssUrl } from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), styleCssGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad content type', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badStyleCssUrl), styleCssGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails if CSS body is empty', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(emptyStyleCssUrl), styleCssGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(httpErrorStyleCssUrl), styleCssGrader));

  expect(result).toMatchObject(expected);
});
