import { randomUUID } from 'node:crypto';
import { Effect } from 'effect';
import type { GraderResult } from '../../../shared/types';
import { projectUrl } from '../utils/project-url';
import { request } from '../utils/request';
import { checkJsonRedirect, checkRedirect, readFormPage } from './responses';
import type { Session } from './session';

/** Fresh credentials meet the PDF's 1–16 alphanumeric username rule. */
export const testAccount = () => ({ username: `gr${randomUUID().replaceAll('-', '').slice(0, 12)}`, pass: randomUUID() });
type Account = ReturnType<typeof testAccount>;

/** Load the authenticated maker page and check its creation form. */
export const readMaker = Effect.fn(function* (session: Session) {
  return yield* readFormPage(yield* session.request('/maker'), session.baseUrl, '/maker', { name: ['text'], age: ['text', 'number'] });
});

/** Register a test account and verify its cookie grants access to the maker page. */
export const signup = Effect.fn(function* (session: Session, account: Account) {
  yield* checkJsonRedirect(yield* session.request('/signup', { ...account, pass2: account.pass }), session.baseUrl, 'Create account');
  if (!session.cookieHeader()) return yield* Effect.fail<GraderResult>({ status: 'fail', message: 'Signup did not establish a session cookie' });
  yield* readMaker(session);
});

/** Authenticate a saved account and verify access on the following request. */
export const login = Effect.fn(function* (session: Session, account: Account) {
  yield* checkJsonRedirect(yield* session.request('/login', account), session.baseUrl, 'Log in');
  yield* readMaker(session);
});

/** Verify that the server redirects an unauthenticated session away from the maker page. */
export const checkLoggedOut = Effect.fn(function* (session: Session) {
  yield* checkRedirect(yield* session.request('/maker'), session.baseUrl, ['/', '/login'], 'Logged-out access to /maker');
});

/** Replaying the old cookie distinguishes session destruction from merely clearing the browser cookie. */
export const logout = Effect.fn(function* (session: Session) {
  const oldCookie = session.cookieHeader();
  yield* checkRedirect(yield* session.request('/logout'), session.baseUrl, ['/', '/login'], 'Log out');
  yield* checkLoggedOut(session);
  if (oldCookie) {
    const replay = yield* request(projectUrl(session.baseUrl, '/maker'), { headers: { Cookie: oldCookie }, redirect: 'manual' });
    yield* checkRedirect(replay, session.baseUrl, ['/', '/login'], 'Access with the logged-out session cookie');
  }
});
