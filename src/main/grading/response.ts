import { Effect, Schema } from 'effect';
import type { HttpClientResponse } from 'effect/http';

import { CheckFailed } from './check';

/** A one-line summary of a response, shown as failure details. */
const describeResponse = (response: HttpClientResponse.HttpClientResponse) => {
  const contentType = response.headers['content-type'] ?? 'no Content-Type';
  return `${response.status} (${contentType}) from ${response.request.url}`;
};

export const expectStatus = Effect.fnUntraced(function* (
  response: HttpClientResponse.HttpClientResponse,
  status: number
) {
  if (response.status === status) return;

  return yield* new CheckFailed({
    message: `Expected HTTP status ${status} but got ${response.status}`,
    details: describeResponse(response)
  });
});

/** Compares the media type only, ignoring parameters such as charset. */
export const expectContentType = Effect.fnUntraced(function* (
  response: HttpClientResponse.HttpClientResponse,
  mediaType: string
) {
  const actual = response.headers['content-type']?.split(';')[0]?.trim().toLowerCase();
  if (actual === mediaType) return;

  return yield* new CheckFailed({
    message: `Expected Content-Type "${mediaType}" but got ${actual ? `"${actual}"` : 'none'}`,
    details: describeResponse(response)
  });
});

/** Malformed or wrongly shaped JSON is the submission's fault, so it fails the check. */
export const readJson = Effect.fnUntraced(function* <S extends Schema.Top>(
  response: HttpClientResponse.HttpClientResponse,
  schema: S
) {
  const text = yield* response.text;

  return yield* Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(text).pipe(
    Effect.mapError(
      (error) =>
        new CheckFailed({
          message: 'Response body was not the expected JSON',
          details: `${error.message}\n\n${text.slice(0, 500)}`
        })
    )
  );
});
