import { isIP } from 'node:net';
import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { checkRedirect, readFormPage } from '../responses';
import { openSession } from '../session';

export const publicAccessGrader: Grader = {
  label: 'Public Forms And Anonymous Route Guards',
  run: (url) =>
    Effect.gen(function* () {
      const session = yield* openSession(url);
      const base = session.baseUrl;
      for (const path of ['/', '/login', '/signup']) {
        const fields = { username: ['text'], pass: ['password'] };
        // Both / and /login host the login form; /signup also requires password confirmation.
        yield* readFormPage(
          yield* session.request(path),
          base,
          path === '/' ? '/login' : path,
          path === '/signup' ? { ...fields, pass2: ['password'] } : fields
        );
      }
      for (const [path, fields] of [
        ['/maker', undefined],
        ['/maker', { name: 'Unauthorized', age: '1' }],
        ['/logout', undefined]
      ] as const) {
        yield* checkRedirect(yield* session.request(path, fields), base, ['/', '/login'], `Anonymous ${fields ? 'POST' : 'GET'} ${path}`);
      }

      // The PDF explicitly permits HTTP during local development. Production must upgrade it.
      const loopback = base.hostname === 'localhost' || base.hostname === '[::1]' || (isIP(base.hostname) === 4 && base.hostname.startsWith('127.'));
      const localHttp = base.protocol === 'http:' && loopback;
      if (!localHttp) {
        const secure = new URL(base);
        secure.protocol = 'https:';
        const insecure = new URL(base);
        insecure.protocol = 'http:';
        for (const [path, method] of [
          ['/', 'GET'],
          ['/login', 'GET'],
          ['/signup', 'GET'],
          ['/login', 'POST'],
          ['/signup', 'POST']
        ] as const) {
          const response = yield* request(projectUrl(insecure, path), { method, redirect: 'manual' });
          yield* checkRedirect(response, secure, [path], `HTTP ${method} ${path}`);
        }
      }
      let message = 'Login and signup forms load; anonymous maker and logout requests redirect to login.';
      if (!localHttp) message += ' HTTP login routes redirect to HTTPS.';
      return { status: 'pass', message };
    })
};
