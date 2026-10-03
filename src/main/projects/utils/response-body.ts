import { Effect } from 'effect';
import type { GraderResult } from '../../../shared/types';
import { errorDetails, responseDetails } from './details';

/** Malformed JSON is an assignment failure; an unreadable text or binary body is an execution error. */
export const responseJson = Effect.fn(function* (response: Response, message: string): Effect.fn.Return<unknown, GraderResult> {
  const text = yield* responseText(response, message);
  return yield* Effect.try({
    try: (): unknown => JSON.parse(text),
    catch: (): GraderResult => ({ status: 'fail', message, details: responseDetails(response) })
  });
});

export const responseText = (response: Response, message: string): Effect.Effect<string, GraderResult> =>
  Effect.tryPromise({
    try: () => response.text(),
    catch: (error) => ({ status: 'error', message, details: errorDetails(error) })
  });

export const responseBytes = (response: Response, message: string): Effect.Effect<Uint8Array, GraderResult> =>
  Effect.tryPromise({
    try: async () => new Uint8Array(await response.arrayBuffer()),
    catch: (error) => ({ status: 'error', message, details: errorDetails(error) })
  });
