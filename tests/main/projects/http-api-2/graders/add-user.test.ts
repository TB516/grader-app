import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { addUserGrader } from '../../../../../src/main/projects/http-api-2/graders/add-user';
import type { GraderResult } from '../../../../../src/shared/types';
import { server } from '../mocks';
import {
  badAddUserCreateStatusUrl,
  badAddUserNoPersistUrl,
  badAddUserNoUpdateUrl,
  badAddUserUpdateStatusUrl,
  goodHttpApi2Url,
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
  const result = await addUserGrader.run(new URL(goodHttpApi2Url));

  expect(result).toMatchObject(expected);
});

test('Grader fails when create returns the wrong status', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await addUserGrader.run(new URL(badAddUserCreateStatusUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails when create does not persist the user', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await addUserGrader.run(new URL(badAddUserNoPersistUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails when update returns the wrong status', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await addUserGrader.run(new URL(badAddUserUpdateStatusUrl));

  expect(result).toMatchObject(expected);
});

test('Grader fails when update does not change the stored age', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await addUserGrader.run(new URL(badAddUserNoUpdateUrl));

  expect(result).toMatchObject(expected);
});
