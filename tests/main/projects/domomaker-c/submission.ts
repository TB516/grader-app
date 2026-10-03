import { randomUUID } from 'node:crypto';
import { http, HttpResponse } from 'msw';

export const baseUrl = 'https://domomaker.example/course/';

type Account = { pass: string; domos: { name: string; age: number }[] };

/** An external submission fixture, exercised through the real registry and HTTP adapter. */
export function submission(
  options: {
    url?: string;
    keepLoggedOutSession?: boolean;
    reuseSessionId?: boolean;
    noSessionCookie?: boolean;
    loseDomosOnLogout?: boolean;
    exposeAllDomos?: boolean;
    dontSaveDomos?: boolean;
    relativeRedirects?: boolean;
    renderDomos?: (domos: Account['domos']) => string;
  } = {}
) {
  const url = options.url ?? baseUrl;
  const accounts = new Map<string, Account>();
  const sessions = new Map<string, string>();
  const requests: { url: string; method: string }[] = [];
  const cookiePath = new URL(url).pathname;
  const makerLocation = options.relativeRedirects ? 'maker' : new URL('maker', url).pathname;
  const identify = (request: Request) => {
    const cookie = request.headers
      .get('Cookie')
      ?.split('; ')
      .find((cookie) => cookie.startsWith('domo.sid='));
    return cookie?.slice('domo.sid='.length) ?? '';
  };
  const redirect = (path: string) => HttpResponse.redirect(new URL(path, url).href, 302);
  const error = (message: string) => HttpResponse.json({ error: message }, { status: 400 });
  const establishSession = (username: string) => {
    let id: string = randomUUID();
    if (options.reuseSessionId) id = username;
    sessions.set(id, username);
    const headers = new Headers();
    headers.append('Set-Cookie', `other=irrelevant; Path=${cookiePath}`);
    if (!options.noSessionCookie) headers.append('Set-Cookie', `domo.sid=${id}; Path=${cookiePath}; HttpOnly`);
    return HttpResponse.json({ redirect: makerLocation }, { headers });
  };
  const form = (path: string, fields: Record<string, string>) => `<form method="POST" action="${new URL(path, url).pathname}">
    ${Object.entries(fields)
      .map(([name, type]) => `<input name="${name}" type="${type}">`)
      .join('')}
    <button>Submit</button></form>`;

  const handler = http.all('*', async ({ request }) => {
    const target = new URL(request.url);
    const base = new URL(url);
    if (target.hostname !== base.hostname || !target.pathname.startsWith(base.pathname)) return undefined;
    requests.push({ url: request.url, method: request.method });
    if (target.protocol === 'http:' && base.protocol === 'https:') {
      target.protocol = 'https:';
      return HttpResponse.redirect(target.href, 308);
    }
    const path = target.pathname.slice(base.pathname.length);
    const sessionId = identify(request);
    const username = sessions.get(sessionId);
    const account = username ? accounts.get(username) : undefined;
    if (['', 'login', 'signup'].includes(path) && account) return redirect('maker');
    if (['maker', 'logout'].includes(path) && !account) return redirect('');

    if (request.method === 'GET') {
      if (path === '' || path === 'login') return HttpResponse.html(form('login', { username: 'text', pass: 'password' }));
      if (path === 'signup') return HttpResponse.html(form('signup', { username: 'text', pass: 'password', pass2: 'password' }));
      if (path === 'maker' && account) {
        let domos = account.domos;
        if (options.exposeAllDomos) domos = [...accounts.values()].flatMap((account) => account.domos);
        return HttpResponse.html(
          form('maker', { name: 'text', age: 'text' }) +
            `<section>${options.renderDomos?.(domos) ?? (domos.map((domo) => `<article>Name: ${domo.name} Age: ${domo.age}</article>`).join('') || '<p>No Domos yet!</p>')}</section>`
        );
      }
      if (path === 'logout') {
        if (!options.keepLoggedOutSession) sessions.delete(sessionId);
        if (options.loseDomosOnLogout && account) account.domos = [];
        return new HttpResponse(null, {
          status: 302,
          headers: {
            Location: new URL('', url).href,
            'Set-Cookie': `domo.sid=; Path=${cookiePath}; Max-Age=0`
          }
        });
      }
    }

    if (request.method === 'POST') {
      const fields = (await request.json()) as Record<string, string>;
      if (path === 'signup') {
        if (!fields.username || !fields.pass || !fields.pass2) return error('All fields are required');
        if (fields.pass !== fields.pass2) return error('Passwords do not match');
        if (!/^[a-zA-Z0-9]{1,16}$/u.test(fields.username)) return error('Invalid username');
        if (accounts.has(fields.username)) return error('Username already in use');
        accounts.set(fields.username, { pass: fields.pass, domos: [] });
        return establishSession(fields.username);
      }
      if (path === 'login') {
        if (!fields.username || !fields.pass || accounts.get(fields.username)?.pass !== fields.pass) return error('Wrong username or password');
        return establishSession(fields.username);
      }
      if (path === 'maker' && account) {
        if (!fields.name || !fields.age || !Number.isFinite(Number(fields.age)) || Number(fields.age) < 0) return error('Invalid name or age');
        if (!options.dontSaveDomos) account.domos.push({ name: fields.name, age: Number(fields.age) });
        return HttpResponse.json({ redirect: makerLocation });
      }
    }
    return new HttpResponse(null, { status: 404 });
  });
  return { handler, accounts, sessions, requests };
}
