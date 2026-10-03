import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { checkLoggedOut, login, logout, signup, testAccount } from '../accounts';
import { checkJsonError, checkRedirect } from '../responses';
import { openSession } from '../session';

export const accountSessionGrader: Grader = {
  label: 'Signup, Login, Logout, And Session Guards',
  run: (url) =>
    Effect.gen(function* () {
      const session = yield* openSession(url);
      const account = testAccount();
      yield* signup(session, account);
      const firstCookie = session.cookieHeader();
      for (const [path, fields] of [
        ['/', undefined],
        ['/login', undefined],
        ['/signup', undefined],
        ['/login', account],
        ['/signup', { ...account, pass2: account.pass }]
      ] as const) {
        yield* checkRedirect(yield* session.request(path, fields), session.baseUrl, ['/maker'], `Authenticated ${fields ? 'POST' : 'GET'} ${path}`);
      }
      yield* logout(session);

      for (const [step, fields] of [
        ['Wrong password', { ...account, pass: 'wrong-password' }],
        ['Unknown username', { ...account, username: testAccount().username }],
        ['Missing username', { pass: account.pass }],
        ['Missing password', { username: account.username }],
        ['Empty username', { ...account, username: '' }],
        ['Empty password', { ...account, pass: '' }]
      ] satisfies [string, Record<string, string>][]) {
        yield* checkJsonError(yield* session.request('/login', fields), `Login: ${step}`);
        yield* checkLoggedOut(session);
      }
      yield* login(session, account);
      if (session.cookieHeader() === firstCookie) return { status: 'fail', message: 'Logging in after logout reused the previous session cookie' };
      yield* logout(session);

      const fresh = testAccount();
      const valid = { ...fresh, pass2: fresh.pass };
      const invalidSignups: [string, Record<string, string>][] = [
        ['Duplicate username', { ...account, pass2: account.pass }],
        ['Mismatched passwords', { ...valid, pass2: 'different-password' }],
        ['Missing both passwords', { username: fresh.username }],
        ['Missing all fields', {}],
        ['Invalid username', { ...valid, username: 'invalid!name' }],
        ['Username longer than 16 characters', { ...valid, username: 'graderaccounttoolong' }]
      ];
      for (const field of ['username', 'pass', 'pass2'] as const) {
        const missing: Record<string, string> = { ...valid };
        delete missing[field];
        invalidSignups.push([`Missing ${field}`, missing], [`Empty ${field}`, { ...valid, [field]: '' }]);
      }
      for (const [step, fields] of invalidSignups) {
        yield* checkJsonError(yield* session.request('/signup', fields), `Signup: ${step}`);
        yield* checkLoggedOut(session);
      }
      // Rejected signups must not reserve the username by silently saving an account.
      yield* signup(session, fresh);
      yield* logout(session);
      return {
        status: 'pass',
        message: `Signup, login, logout, session invalidation, route guards, and credential validation passed. Test accounts ${account.username} and ${fresh.username} remain in the database.`
      };
    })
};
