import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { getUsersGetGrader } from '../../../../../src/main/projects/http-api-2/graders/get-users-get';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badContentTypeGetUsersGetUrl,
  badGetUsersGetUrl,
  goodHttpApi2Url,
  httpErrorGetUsersGetUrl,
  invalidJsonGetUsersGetUrl,
  resetGoodHttpApi2Users
} from '../mocks/http-api-2-handlers';

beforeAll(() => server.listen());
afterEach(() => {
  resetGoodHttpApi2Users();
  server.resetHandlers();
});
afterAll(() => server.close());

test('Grader passes good assignment', async () => {
  const expected = { status: 'pass', message: expect.any(String) } satisfies GraderResult;
  const result = await getUsersGetGrader.run(new URL(goodHttpApi2Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails if JSON body is not a users object', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await getUsersGetGrader.run(new URL(badGetUsersGetUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails invalid JSON', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await getUsersGetGrader.run(new URL(invalidJsonGetUsersGetUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails bad content type', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await getUsersGetGrader.run(new URL(badContentTypeGetUsersGetUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails a non 200 response', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await getUsersGetGrader.run(new URL(httpErrorGetUsersGetUrl));

  expect(result).toMatchObject(expected);
});
