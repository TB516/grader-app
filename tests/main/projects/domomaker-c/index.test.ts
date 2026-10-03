import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { gradingRun, runGrader } from '../../../../src/main/grading-run';
import { projectRouter } from '../../../../src/main/project-router';
import { domomakerCGraders } from '../../../../src/main/projects/domomaker-c';
import type { GradingEvent } from '../../../../src/shared/types';
import { baseUrl, submission } from './submission';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Domomaker C runs through the registry with isolated sessions and deployment subpaths', async () => {
  const fixture = submission();
  server.use(fixture.handler);
  const events: GradingEvent[] = [];
  const { url, graders } = Effect.runSync(projectRouter({ assignment: 'Domomaker C', url: baseUrl }));
  await Effect.runPromise(gradingRun('domomaker', url, graders, (event) => events.push(event)));
  expect(events[0].type).toBe('started');
  const results = events.filter((event) => event.type === 'result');
  expect(Object.fromEntries(results.map(({ check }) => [check.id, check.result?.status]))).toEqual({
    'public-access': 'pass',
    'account-session': 'pass',
    domos: 'pass'
  });
  expect(events.at(-1)).toEqual({ runId: 'domomaker', type: 'finished', outcome: 'completed' });
  expect(fixture.accounts.size).toBe(4);
  expect([...fixture.accounts.values()].map((account) => account.domos.length).sort()).toEqual([0, 0, 1, 2]);
  expect(fixture.sessions.size).toBe(0);
});

test('Accepts the local-development HTTP bypass without probing HTTPS', async () => {
  const url = new URL('http://127.0.0.1:4315/course/');
  const fixture = submission({ url: url.href });
  server.use(fixture.handler);
  expect(await Effect.runPromise(runGrader(url, domomakerCGraders['public-access']))).toMatchObject({ status: 'pass' });
  expect(fixture.requests.every((request) => request.url.startsWith(url.href))).toBe(true);
});

test('Follows the initial HTTPS upgrade before sending credentials', async () => {
  const fixture = submission();
  server.use(fixture.handler);
  expect(await Effect.runPromise(runGrader(new URL(baseUrl.replace('https:', 'http:')), domomakerCGraders['account-session']))).toMatchObject({
    status: 'pass'
  });
  expect(fixture.requests.filter((request) => request.method === 'POST').every((request) => request.url.startsWith('https:'))).toBe(true);
});

test('Resolves relative redirects under a deployment path entered without a trailing slash', async () => {
  server.use(submission({ relativeRedirects: true }).handler);
  expect(await Effect.runPromise(runGrader(new URL(baseUrl.slice(0, -1)), domomakerCGraders['account-session']))).toMatchObject({ status: 'pass' });
});

test.each([
  ['maker', 'GET'],
  ['maker', 'POST'],
  ['logout', 'GET']
] as const)('Rejects anonymous %s %s without a redirect', async (path, method) => {
  server.use(submission().handler);
  server.use(
    http.all(`${baseUrl}${path}`, ({ request }) => {
      if (request.method === method) return HttpResponse.html('Unexpected access');
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['public-access']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('Anonymous')
  });
});

test.each([
  ['', 'GET'],
  ['login', 'GET'],
  ['signup', 'GET'],
  ['login', 'POST'],
  ['signup', 'POST']
] as const)('Requires an HTTPS redirect for HTTP %s %s', async (path, method) => {
  server.use(submission().handler);
  server.use(
    http.all(`${baseUrl.replace('https:', 'http:')}${path}`, ({ request }) => {
      if (request.method === method) return HttpResponse.html('Still HTTP');
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['public-access']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining(`HTTP ${method}`)
  });
});

test('Rejects a route guard that redirects to another host', async () => {
  server.use(submission().handler);
  server.use(http.get(`${baseUrl}maker`, () => HttpResponse.redirect('https://another.example/')));
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['public-access']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('redirect to /')
  });
});

test('Checks form input types and the POST action on public pages', async () => {
  server.use(submission().handler);
  server.use(
    http.get(`${baseUrl}signup`, () =>
      HttpResponse.html('<form method="POST" action="/course/signup"><input name="username"><input name="pass"><input name="pass2"></form>')
    )
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['public-access']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('inputs')
  });
});

test.each([
  { options: { keepLoggedOutSession: true }, message: 'logged-out session cookie' },
  { options: { reuseSessionId: true }, message: 'reused the previous session cookie' },
  { options: { noSessionCookie: true }, message: '/maker' }
])('Rejects broken session behavior: $options', async ({ options, message }) => {
  server.use(submission(options).handler);
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['account-session']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining(message)
  });
});

test.each(['login', 'signup'])('Requires the logged-in guard on POST /%s', async (path) => {
  const fixture = submission();
  server.use(fixture.handler);
  server.use(
    http.post(`${baseUrl}${path}`, ({ request }) => {
      if (request.headers.get('Cookie')?.includes('domo.sid=')) return HttpResponse.json({ redirect: '/course/maker' });
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['account-session']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining(`Authenticated POST /${path}`)
  });
});

test.each(['username', 'pass', 'pass2'])('Rejects signup that accepts a missing %s', async (field) => {
  server.use(submission().handler);
  server.use(
    http.post(`${baseUrl}signup`, async ({ request }) => {
      const fields = (await request.clone().json()) as Record<string, string>;
      if (!(field in fields) && Object.keys(fields).length === 2) return HttpResponse.json({ redirect: '/course/maker' });
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['account-session']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining(`Missing ${field}`)
  });
});

test('Checks that invalid credentials leave the user logged out even when an error is returned', async () => {
  const fixture = submission();
  server.use(fixture.handler);
  server.use(
    http.post(`${baseUrl}login`, async ({ request }) => {
      const fields = (await request.clone().json()) as Record<string, string>;
      if (fields.pass !== 'wrong-password') return undefined;
      fixture.sessions.set('bad-session', fields.username);
      return HttpResponse.json({ error: 'Wrong password' }, { status: 401, headers: { 'Set-Cookie': 'domo.sid=bad-session; Path=/course/' } });
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['account-session']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('Logged-out access')
  });
});

test.each([{ dontSaveDomos: true }, { exposeAllDomos: true }, { loseDomosOnLogout: true }])(
  'Rejects broken Domo persistence or isolation: %j',
  async (options) => {
    server.use(submission(options).handler);
    expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders.domos))).toMatchObject({
      status: 'fail',
      message: expect.stringContaining('/maker')
    });
  }
);

test('Rejects invalid Domo creation that returns an error but changes the list', async () => {
  const fixture = submission();
  server.use(fixture.handler);
  server.use(
    http.post(`${baseUrl}maker`, async ({ request }) => {
      const fields = (await request.clone().json()) as Record<string, string>;
      if (fields.name) return undefined;
      for (const account of fixture.accounts.values()) account.domos.push({ name: 'Invalid', age: 3 });
      return HttpResponse.json({ error: 'Missing name' }, { status: 400 });
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders.domos))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('invalid request changed')
  });
});

test.each(['-1', 'not-a-number'])('Rejects acceptance of invalid Domo age %s', async (age) => {
  server.use(submission().handler);
  server.use(
    http.post(`${baseUrl}maker`, async ({ request }) => {
      const fields = (await request.clone().json()) as Record<string, string>;
      if (fields.age === age) return HttpResponse.json({ redirect: '/course/maker' });
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders.domos))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('expected a JSON error')
  });
});

test('Concurrent runs use distinct accounts and cookie jars', async () => {
  const fixture = submission();
  server.use(fixture.handler);
  const results = await Promise.all([
    Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders.domos)),
    Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders.domos))
  ]);
  expect(results.map((result) => result.status)).toEqual(['pass', 'pass']);
  expect(fixture.accounts.size).toBe(4);
  expect(fixture.sessions.size).toBe(0);
});

test('Rejects signup that accepts both missing passwords', async () => {
  server.use(submission().handler);
  server.use(
    http.post(`${baseUrl}signup`, async ({ request }) => {
      const fields = (await request.clone().json()) as Record<string, string>;
      if (fields.username && !('pass' in fields) && !('pass2' in fields)) return HttpResponse.json({ redirect: '/course/maker' });
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['account-session']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('Missing both passwords')
  });
});

test('Rejected signup must not silently reserve the username', async () => {
  const fixture = submission();
  server.use(fixture.handler);
  server.use(
    http.post(`${baseUrl}signup`, async ({ request }) => {
      const fields = (await request.clone().json()) as Record<string, string>;
      if (fields.pass2 !== 'different-password') return undefined;
      fixture.accounts.set(fields.username, { pass: fields.pass, domos: [] });
      return HttpResponse.json({ error: 'Passwords differ' }, { status: 400 });
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), domomakerCGraders['account-session']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('Create account')
  });
});
