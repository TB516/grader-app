import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { timeTextGrader } from '../../../../../src/main/projects/simple-http/graders/time-text';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badContentTypeTimeTextUrl,
  badTimeTextUrl,
  goodTimeTextUrl,
  httpErrorTimeTextUrl,
  networkErrorTimeTextUrl,
  timeParseFailureTimeTextUrl
} from '../mocks/time-text-handlers';

describe('Time text endpoint tests', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  test('Grader passes good assignment', async () => {
    const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
    const result = await timeTextGrader.run(goodTimeTextUrl);

    expect(result).toMatchObject(expected);
  });

  test('Grader fails bad assignment', async () => {
    const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
    const result = await timeTextGrader.run(badTimeTextUrl);

    expect(result).toMatchObject(expected);
  });

  test('Grader errors a non 200 response', async () => {
    const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
    const result = await timeTextGrader.run(httpErrorTimeTextUrl);

    expect(result).toMatchObject(expected);
  });

  test('Grader errors on network error', async () => {
    const expected = { status: 'error', message: expect.any(String) } satisfies GraderResult;
    const result = await timeTextGrader.run(networkErrorTimeTextUrl);

    expect(result).toMatchObject(expected);
  });

  test('Grader fails if the time string does not parse', async () => {
    const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
    const result = await timeTextGrader.run(timeParseFailureTimeTextUrl);

    expect(result).toMatchObject(expected);
  });

  test("Grader fails if the content type is not 'text/plain'", async () => {
    const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
    const result = await timeTextGrader.run(badContentTypeTimeTextUrl);

    expect(result).toMatchObject(expected);
  });
});
