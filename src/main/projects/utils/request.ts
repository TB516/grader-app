import http from 'node:http';
import https from 'node:https';
import { Effect } from 'effect';
import type { GraderResult } from '../../../shared/types';
import { errorDetails } from './details';

const fetchErrorResult = (error: unknown): GraderResult => ({
  status: 'error',
  message: 'A fetch error occurred',
  details: errorDetails(error)
});

// Keep requests alive while their bodies are read. The check's scope also closes
// unread bodies when a grader returns early on an invalid status or header.
const requestSignal = Effect.acquireRelease(
  Effect.sync(() => new AbortController()),
  (controller) => Effect.sync(() => controller.abort())
).pipe(Effect.map((controller) => AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)])));

/** Bound every request, including its body, and release it when the check ends. */
export const request = Effect.fn(function* (url: URL, options: Omit<RequestInit, 'signal'> = {}) {
  const signal = yield* requestSignal;
  return yield* Effect.tryPromise({
    try: () => fetch(url, { ...options, signal }),
    catch: fetchErrorResult
  });
});

/** Node's HTTP client can omit Accept; fetch automatically adds that header. */
export const requestWithoutAccept = Effect.fn(function* (url: URL) {
  const signal = yield* requestSignal;
  let target = url;
  for (let redirects = 0; redirects <= 20; redirects += 1) {
    const result = yield* Effect.tryPromise({
      try: () =>
        new Promise<Response>((resolve, reject) => {
          const get = target.protocol === 'https:' ? https.get : http.get;
          const outgoing = get(target, { signal }, async (response) => {
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of response) chunks.push(Buffer.from(chunk));
              const headers = new Headers();
              for (let index = 0; index < response.rawHeaders.length; index += 2) {
                headers.append(response.rawHeaders[index], response.rawHeaders[index + 1]);
              }
              const status = response.statusCode ?? 500;
              const body = [204, 205, 304].includes(status) ? null : Buffer.concat(chunks);
              resolve(new Response(body, { status, headers }));
            } catch (error) {
              reject(error);
            }
          });
          outgoing.on('error', reject);
        }),
      catch: fetchErrorResult
    });
    const location = result.headers.get('Location');
    if (![301, 302, 303, 307, 308].includes(result.status) || !location) return result;
    target = yield* Effect.try({ try: () => new URL(location, target), catch: fetchErrorResult });
    if (target.protocol !== 'http:' && target.protocol !== 'https:') break;
  }
  return yield* Effect.fail<GraderResult>({ status: 'error', message: 'The request could not follow the deployment redirects' });
});
