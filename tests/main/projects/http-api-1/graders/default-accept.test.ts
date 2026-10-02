import { createServer } from 'node:http';
import { expect, test } from 'vitest';
import { jsonDefaultGrader } from '../../../../../src/main/projects/http-api-1/graders/json-default';

test('Default-format grading sends no Accept header over HTTP', async () => {
  const acceptHeaders: (string | undefined)[] = [];
  const server = createServer((request, response) => {
    acceptHeaders.push(request.headers.accept);
    const url = new URL(request.url!, 'http://localhost');
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
    const result = await jsonDefaultGrader.run(new URL(`http://127.0.0.1:${address.port}`));
    expect(result.status).toBe('pass');
    expect(acceptHeaders.length).toBeGreaterThan(0);
    expect(acceptHeaders.every((header) => header === undefined)).toBe(true);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
