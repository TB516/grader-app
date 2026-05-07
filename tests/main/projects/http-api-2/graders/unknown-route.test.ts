import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { unknownRouteGrader } from '../../../../../src/main/projects/http-api-2/graders/unknown-route';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import { badUnknownRouteJsonUrl, badUnknownRouteStatusUrl, goodHttpApi2Url } from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await unknownRouteGrader.run(new URL(goodHttpApi2Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 404 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await unknownRouteGrader.run(new URL(badUnknownRouteStatusUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails malformed JSON errors when JSON is returned', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await unknownRouteGrader.run(new URL(badUnknownRouteJsonUrl));

  expect(result).toMatchObject(expected);
});
