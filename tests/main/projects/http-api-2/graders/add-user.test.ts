import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
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
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), addUserGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails when create returns the wrong status', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badAddUserCreateStatusUrl), addUserGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails when create does not persist the user', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badAddUserNoPersistUrl), addUserGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails when update returns the wrong status', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badAddUserUpdateStatusUrl), addUserGrader));

  expect(result).toMatchObject(expected);
});

test('Grader fails when update does not change the stored age', async () => {
  const expected = { status: 'fail', message: expect.any(String) } satisfies GraderResult;
  const result = await Effect.runPromise(runGrader(new URL(badAddUserNoUpdateUrl), addUserGrader));

  expect(result).toMatchObject(expected);
});

test('Grader supports query-string POSTs and array user collections', async () => {
  const users = new Map<string, { name: string; age: number }>();
  server.use(
    http.post(`${goodHttpApi2Url}/addUser`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      const name = params.get('name');
      const age = params.get('age');
      if (!name || !age) return HttpResponse.json({ message: 'Missing field', id: 'missingParams' }, { status: 400 });
      const exists = users.has(name);
      users.set(name, { name, age: Number(age) });
      if (exists) return new HttpResponse(null, { status: 204 });
      return HttpResponse.json({ message: 'Created' }, { status: 201 });
    }),
    http.get(`${goodHttpApi2Url}/getUsers`, () => HttpResponse.json({ users: [...users.values()] }))
  );
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), addUserGrader));
  expect(result).toMatchObject({ status: 'pass', message: expect.stringContaining('query') });
  expect([...users.values()]).toEqual([{ name: expect.any(String), age: 22 }]);
});

test.each(['name', 'age'])('Grader catches acceptance of a missing %s independently', async (field) => {
  server.use(
    http.post(`${goodHttpApi2Url}/addUser`, async ({ request }) => {
      const fields = new URLSearchParams(await request.clone().text());
      if (!fields.has(field) && fields.size === 1) {
        return HttpResponse.json({ message: 'Incorrectly accepted' }, { status: 201 });
      }
      // Let the existing assignment fixture handle all other requests.
      return undefined;
    })
  );
  const result = await Effect.runPromise(runGrader(new URL(goodHttpApi2Url), addUserGrader));
  expect(result).toMatchObject({ status: 'fail', message: expect.stringContaining(`Missing ${field}:`) });
});

test('Concurrent runs use independent test users', async () => {
  const results = await Promise.all([
    Effect.runPromise(runGrader(new URL(goodHttpApi2Url), addUserGrader)),
    Effect.runPromise(runGrader(new URL(goodHttpApi2Url), addUserGrader))
  ]);
  expect(results.map((result) => result.status)).toEqual(['pass', 'pass']);
});
