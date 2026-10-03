import { Effect } from 'effect';
import { CookieJar } from 'tough-cookie';
import type { GraderResult } from '../../../shared/types';
import { projectUrl } from '../utils/project-url';
import { request } from '../utils/request';

/** Keep cookies local to one simulated user and expose redirects to the graders. */
const createSession = (baseUrl: URL) => {
  const cookies = new CookieJar();
  return {
    baseUrl,
    cookieHeader: () => cookies.getCookieStringSync(projectUrl(baseUrl, '/maker').href),
    request: Effect.fn(function* (path: string, fields?: Record<string, string>) {
      const url = projectUrl(baseUrl, path);
      const headers = new Headers({ Cookie: cookies.getCookieStringSync(url.href) });
      if (fields) headers.set('Content-Type', 'application/json');
      const response = yield* request(url, {
        method: fields ? 'POST' : 'GET',
        headers,
        body: fields ? JSON.stringify(fields) : undefined,
        redirect: 'manual'
      });
      for (const cookie of response.headers.getSetCookie()) cookies.setCookieSync(cookie, url.href, { ignoreError: true });
      return response;
    })
  };
};

export type Session = ReturnType<typeof createSession>;

/** Resolve a same-host HTTPS upgrade before posting any test credentials. */
export const openSession = Effect.fn(function* (url: URL) {
  const baseUrl = projectUrl(url, '/');
  const response = yield* request(projectUrl(baseUrl, '/'), { redirect: 'manual' });
  const location = response.headers.get('Location');
  if (response.status >= 300 && response.status < 400 && location) {
    const target = yield* Effect.try({
      try: () => new URL(location, baseUrl),
      catch: (): GraderResult => ({ status: 'fail', message: 'The home page returned an invalid redirect URL' })
    });
    if (target.hostname !== baseUrl.hostname) {
      return yield* Effect.fail<GraderResult>({ status: 'error', message: 'Cannot test a deployment that redirects to another host' });
    }
    if (baseUrl.protocol === 'http:' && target.protocol === 'https:') {
      baseUrl.protocol = target.protocol;
      baseUrl.port = target.port;
    }
  }
  return createSession(baseUrl);
});
