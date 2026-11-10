import { Effect, Schema } from 'effect';
import { HttpClient } from 'effect/http';

import { CheckFailed, type Check } from '../grading/check';
import { expectContentType, expectStatus, readJson } from '../grading/response';

const HELLO = 'Hello World';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const getHtml = Effect.fnUntraced(function* (path: string) {
  const response = yield* HttpClient.get(path);
  yield* expectStatus(response, 200);
  yield* expectContentType(response, 'text/html');

  const html = yield* response.text;
  if (!html.trim()) return yield* new CheckFailed({ message: `${path} returned an empty page` });

  return html;
});

const getText = Effect.fnUntraced(function* (path: string) {
  const response = yield* HttpClient.get(path);
  yield* expectStatus(response, 200);
  yield* expectContentType(response, 'text/plain');

  return yield* response.text;
});

const getJson = Effect.fnUntraced(function* <S extends Schema.Top>(path: string, schema: S) {
  const response = yield* HttpClient.get(path);
  yield* expectStatus(response, 200);
  yield* expectContentType(response, 'application/json');

  return yield* readJson(response, schema);
});

const clockPart = (maximum: number) => Schema.Int.check(Schema.isBetween({ minimum: 0, maximum }));

/** H:M:S with or without leading zeros, as the PDF's getHours/getMinutes/getSeconds produce. */
const ClockTime = Schema.TemplateLiteralParser([
  clockPart(23),
  ':',
  clockPart(59),
  ':',
  clockPart(59)
]);

/**
 * The PDF's time is in the server's time zone, which a response doesn't reveal. Time zones are
 * whole multiples of 15 minutes apart, so only the offset within 15 minutes is compared.
 */
const expectCurrentTime = Effect.fnUntraced(function* (time: string) {
  const [hour, , minute, , second] = yield* Schema.decodeUnknownEffect(ClockTime)(time.trim()).pipe(
    Effect.mapError(() => new CheckFailed({ message: `"${time}" is not a time like 14:5:9` }))
  );

  const theirs = Temporal.PlainTime.from({ hour, minute, second });
  const ours = Temporal.Now.plainTimeISO('UTC');

  const block = 15 * 60;
  const offset = Math.abs(theirs.since(ours).total('seconds')) % block;
  if (Math.min(offset, block - offset) > 60) {
    return yield* new CheckFailed({ message: `"${time}" is not the current time` });
  }
});

export const simpleHttp: Check[] = [
  {
    label: 'Index page is HTML',
    run: Effect.gen(function* () {
      yield* getHtml('/');
      return '/ returned an HTML page';
    })
  },
  {
    label: 'Unknown URLs return the index page',
    run: Effect.gen(function* () {
      const fallback = yield* getHtml('/this-page-does-not-exist');
      const index = yield* getHtml('/');
      if (fallback !== index) {
        return yield* new CheckFailed({
          message: 'An unknown URL returned a different page than /'
        });
      }

      return 'An unknown URL returned the index page';
    })
  },
  {
    label: 'Page 2 is HTML',
    run: Effect.gen(function* () {
      yield* getHtml('/page2');
      return '/page2 returned an HTML page';
    })
  },
  {
    label: '/time returns the current time as text',
    run: Effect.gen(function* () {
      const time = yield* getText('/time');
      yield* expectCurrentTime(time);
      return `/time returned "${time}"`;
    })
  },
  {
    label: `/hello returns "${HELLO}" as text`,
    run: Effect.gen(function* () {
      const text = yield* getText('/hello');
      if (text.trim() !== HELLO) {
        return yield* new CheckFailed({ message: `Expected "${HELLO}" but got "${text}"` });
      }

      return `/hello returned "${HELLO}"`;
    })
  },
  {
    label: '/timeJSON returns the current time as JSON',
    run: Effect.gen(function* () {
      const { time } = yield* getJson('/timeJSON', Schema.Struct({ time: Schema.String }));
      yield* expectCurrentTime(time);
      return `/timeJSON returned { "time": "${time}" }`;
    })
  },
  {
    label: `/helloJSON returns "${HELLO}" as JSON`,
    run: Effect.gen(function* () {
      yield* getJson('/helloJSON', Schema.Struct({ message: Schema.Literal(HELLO) }));
      return `/helloJSON returned { "message": "${HELLO}" }`;
    })
  },
  {
    label: '/dankmemes returns a PNG image',
    run: Effect.gen(function* () {
      const response = yield* HttpClient.get('/dankmemes');
      yield* expectStatus(response, 200);
      yield* expectContentType(response, 'image/png');

      const bytes = new Uint8Array(yield* response.arrayBuffer);
      if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
        return yield* new CheckFailed({ message: 'The response body is not a PNG file' });
      }

      return '/dankmemes returned a PNG image';
    })
  }
];
