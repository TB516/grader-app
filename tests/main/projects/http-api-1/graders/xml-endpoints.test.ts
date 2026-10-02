import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { xmlEndpointsGrader } from '../../../../../src/main/projects/http-api-1/graders/xml-endpoints';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badXmlContentTypeUrl,
  badXmlStatusUrl,
  goodHttpApi1InternalErrorUrl,
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

test('Grader passes when /internal uses internalError id variant', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await xmlEndpointsGrader.run(new URL(goodHttpApi1InternalErrorUrl));

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

test.each([
  '<response><message>ok</message>',
  '<response><!-- <message>ok</message> --></response>',
  '<response><message>&unknown;</message></response>',
  '<response><message>ok</message></response><extra/>',
  '<response><MESSAGE>ok</MESSAGE></response>'
])('Grader rejects invalid XML or missing message content: %s', async (body) => {
  server.use(http.get(`${goodHttpApi1Url}/success`, () => new HttpResponse(body, { headers: { 'Content-Type': 'text/xml' } })));
  expect((await xmlEndpointsGrader.run(new URL(goodHttpApi1Url))).status).toBe('fail');
});

test('Grader accepts XML entities and CDATA in a valid response', async () => {
  server.use(
    http.get(`${goodHttpApi1Url}/badRequest`, ({ request }) => {
      const valid = new URL(request.url).searchParams.get('valid') === 'true';
      return new HttpResponse(
        valid
          ? '<response><message>ok &amp; valid</message></response>'
          : '<response><message><![CDATA[Please provide valid=true]]></message><id>badRequ&#101;st</id></response>',
        { status: valid ? 200 : 400, headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
      );
    })
  );
  expect((await xmlEndpointsGrader.run(new URL(goodHttpApi1Url))).status).toBe('pass');
});
