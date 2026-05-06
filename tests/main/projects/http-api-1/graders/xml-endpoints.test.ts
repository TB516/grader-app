import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { xmlEndpointsGrader } from '../../../../../src/main/projects/http-api-1/graders/xml-endpoints';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badXmlContentTypeUrl,
  badXmlStatusUrl,
  goodHttpApi1Url,
  missingXmlMessageUrl,
  networkErrorApiUrl,
  wrongXmlIdUrl
} from '../mocks/http-api-1-handlers';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await xmlEndpointsGrader.run(new URL(goodHttpApi1Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails if a status is wrong', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await xmlEndpointsGrader.run(new URL(badXmlStatusUrl));

  expect(result).toMatchObject(expected);
});

test("Grader fails if the content type is not 'text/xml' or 'application/xml'", async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await xmlEndpointsGrader.run(new URL(badXmlContentTypeUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if XML message is missing', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await xmlEndpointsGrader.run(new URL(missingXmlMessageUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails if XML error id is wrong', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await xmlEndpointsGrader.run(new URL(wrongXmlIdUrl));

  expect(result).toMatchObject(expected);
});

test('Grader errors on network error', async () => {
  const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
  const result = await xmlEndpointsGrader.run(new URL(networkErrorApiUrl));

  expect(result).toMatchObject(expected);
});
