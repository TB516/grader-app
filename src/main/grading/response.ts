import { Effect, Schema, Stream } from 'effect';
import { Xml } from 'effect/encoding';
import { HttpClient, type HttpClientResponse } from 'effect/http';

import { CheckFailed } from './check';

/** A one-line summary of a response, shown as failure details. */
const describeResponse = (response: HttpClientResponse.HttpClientResponse) => {
  const contentType = response.headers['content-type'] ?? 'no Content-Type';
  const accept = response.request.headers['accept'];
  const asked = accept ? ` (asked for ${accept})` : '';
  return `${response.status} (${contentType}) from ${response.request.url}${asked}`;
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

/** GETs a page and expects a non-empty HTML page back. */
export const getHtml = Effect.fnUntraced(function* (path: string) {
  const response = yield* HttpClient.get(path);
  yield* expectStatus(response, 200);
  yield* expectContentType(response, 'text/html');

  const html = yield* response.text;
  if (!html.trim()) return yield* new CheckFailed({ message: `${path} returned an empty page` });

  return html;
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
          details: `${describeResponse(response)}\n${error.message}\n\n${text.slice(0, 500)}`
        })
    )
  );
});

/**
 * Turns an element into plain values for a schema: an element with only text becomes its text,
 * and one with child elements becomes an object keyed by their names. Attributes are ignored.
 */
const elementValue = (element: Xml.Element): unknown => {
  const children = element.children.filter((child) => typeof child !== 'string');
  if (children.length === 0) return element.children.join('').trim();

  return Object.fromEntries(children.map((child) => [child.name, elementValue(child)]));
};

/**
 * Like readJson, for XML. The schema sees the document as nested objects, so
 * <response><message>Hi</message></response> decodes as { response: { message: 'Hi' } }.
 * The body must be well-formed, since a browser's parser rejects anything else.
 */
export const readXml = Effect.fnUntraced(function* <S extends Schema.Top>(
  response: HttpClientResponse.HttpClientResponse,
  schema: S
) {
  const text = yield* response.text;

  const root = yield* Stream.make(text).pipe(
    Stream.pipeThroughChannel(Xml.decodeString()),
    Stream.pipeThroughChannel(Xml.elements(['*'])),
    Stream.runHead,
    Effect.flatMap((first) => Effect.fromOption(first)),
    Effect.mapError(
      (error) =>
        new CheckFailed({
          message: 'Response body was not valid XML',
          details: `${describeResponse(response)}\n${error.message}\n\n${text.slice(0, 500)}`
        })
    )
  );

  const document = { [root.name]: elementValue(root) };

  return yield* Schema.decodeUnknownEffect(schema)(document).pipe(
    Effect.mapError(
      (error) =>
        new CheckFailed({
          message: 'Response body was not the expected XML',
          details: `${describeResponse(response)}\n${error.message}\n\n${text.slice(0, 500)}`
        })
    )
  );
});
