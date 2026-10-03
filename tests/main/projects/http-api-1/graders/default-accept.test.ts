import { createServer } from 'node:http';
import { Effect } from 'effect';
import { expect, test } from 'vitest';
import { runGrader } from '../../../../../src/main/grading-run';
import { jsonDefaultGrader } from '../../../../../src/main/projects/http-api-1/graders/json-default';

test('Default-format grading preserves absent Accept through redirects and checks browser defaults', async () => {
  const acceptHeaders: (string | undefined)[] = [];
  const server = createServer((request, response) => {
    acceptHeaders.push(request.headers.accept);
    const url = new URL(request.url!, 'http://localhost');
    if (!url.pathname.startsWith('/redirected/')) {
      response.writeHead(302, { Location: `/redirected${url.pathname}${url.search}` });
      response.end();
      return;
    }
    url.pathname = url.pathname.replace('/redirected', '');
    const routes: Record<string, [number, string?]> = {
      '/success': [200],
      '/badRequest': [400, 'badRequest'],
      '/unauthorized': [401, 'unauthorized'],
      '/forbidden': [403, 'forbidden'],
      '/internal': [500, 'internalError'],
      '/notImplemented': [501, 'notImplemented']
    };
    let [status, id] = routes[url.pathname] ?? [404, 'notFound'];
    if (url.searchParams.get('valid') === 'true' || url.searchParams.get('loggedIn') === 'yes') {
      status = 200;
      id = undefined;
    }
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Response', id }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');
    const result = await Effect.runPromise(runGrader(new URL(`http://127.0.0.1:${address.port}`), jsonDefaultGrader));
    expect(result.status).toBe('pass');
    expect(acceptHeaders.length).toBeGreaterThan(0);
    expect(new Set(acceptHeaders)).toEqual(new Set([undefined, '*/*', 'text/html']));
    expect(acceptHeaders.filter((header) => header === undefined)).toHaveLength(22);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
