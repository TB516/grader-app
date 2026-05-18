import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { homePageGrader } from '../../../../../src/main/projects/http-api-1/graders/home-page';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badHomePageContentTypeUrl,
  emptyHomePageUrl,
  goodHttpApi1Url,
  httpErrorHomePageUrl,
  missingHomePageAcceptHeaderUrl,
  missingHomePageConsoleLogUrl,
  missingHomePageContentTypeBranchUrl,
  missingHomePageCssLinkUrl,
  missingHomePageJsonParseUrl,
  missingHomePageRouteControlsUrl,
  missingHomePageSendTriggerUrl,
  missingHomePageTypeControlsUrl,
  missingHomePageXmlHandlingUrl,
  networkErrorHomePageUrl
} from '../mocks/http-api-1-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await homePageGrader.run(new URL(goodHttpApi1Url));

  expect(result).toMatchObject(expected);
});

test.each([
  ['CSS link is missing', missingHomePageCssLinkUrl],
  ['route selection controls are missing', missingHomePageRouteControlsUrl],
  ['response type controls are missing', missingHomePageTypeControlsUrl],
  ['send trigger is missing', missingHomePageSendTriggerUrl],
  ['Accept header usage is missing', missingHomePageAcceptHeaderUrl],
  ['Content-Type branch logic is missing', missingHomePageContentTypeBranchUrl],
  ['JSON parse path is missing', missingHomePageJsonParseUrl],
  ['XML handling path is missing', missingHomePageXmlHandlingUrl],
  ['raw console logging is missing', missingHomePageConsoleLogUrl]
])('Grader fails if home page %s', async (_label, url) => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await homePageGrader.run(new URL(url));

  expect(result).toMatchObject(expected);
});

test('Grader fails if HTML body is empty', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await homePageGrader.run(new URL(emptyHomePageUrl));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'text/html'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await homePageGrader.run(new URL(badHomePageContentTypeUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await homePageGrader.run(new URL(httpErrorHomePageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await homePageGrader.run(new URL(networkErrorHomePageUrl));

  expect(result).toMatchObject(expected);
});
