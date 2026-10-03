import { load } from 'cheerio';
import { Effect, Schema } from 'effect';
import type { GraderResult } from '../../../shared/types';
import { contentTypeCheck } from '../utils/content-type-check';
import { responseDetails } from '../utils/details';
import { projectUrl } from '../utils/project-url';
import { responseJson, responseText } from '../utils/response-body';

const redirectSchema = Schema.Struct({ redirect: Schema.Trim.check(Schema.isNonEmpty()) });
const errorSchema = Schema.Struct({ error: Schema.Trim.check(Schema.isNonEmpty()) });

const redirectUrl = (value: string, baseUrl: URL) =>
  Effect.try({
    try: () => new URL(value, baseUrl),
    catch: (): GraderResult => ({ status: 'fail', message: 'The response contained an invalid redirect URL' })
  });

/** Validate the URL named by a redirect response. */
const checkDestination = Effect.fn(function* (value: string, baseUrl: URL, paths: string[], step: string) {
  const target = yield* redirectUrl(value, baseUrl);
  if (
    !paths.some((path) => {
      const expected = projectUrl(baseUrl, path);
      return target.origin === expected.origin && target.pathname.replace(/\/$/u, '') === expected.pathname.replace(/\/$/u, '');
    })
  ) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${step}: expected a redirect to ${paths.join(' or ')}`,
      details: target.href
    });
  }
});

export const checkRedirect = Effect.fn(function* (response: Response, baseUrl: URL, paths: string[], step: string) {
  const location = response.headers.get('Location');
  if (![301, 302, 303, 307, 308].includes(response.status) || !location) {
    return yield* Effect.fail<GraderResult>({ status: 'fail', message: `${step}: expected an HTTP redirect`, details: responseDetails(response) });
  }
  yield* checkDestination(location, baseUrl, paths, step);
});

/** Parts A/B define JSON redirect and error responses for the bundled client. */
export const checkJsonRedirect = Effect.fn(function* (response: Response, baseUrl: URL, step: string) {
  const failure = contentTypeCheck(response, 'application/json');
  if (!response.ok || failure) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${step}: expected a successful JSON response`,
      details: responseDetails(response)
    });
  }
  const input = yield* responseJson(response, `${step}: malformed JSON`);
  const body = yield* Schema.decodeUnknownEffect(redirectSchema)(input).pipe(
    Effect.mapError((): GraderResult => ({ status: 'fail', message: `${step}: expected a JSON redirect`, details: JSON.stringify(input) }))
  );
  yield* checkDestination(body.redirect, baseUrl, ['/maker'], step);
});

export const checkJsonError = Effect.fn(function* (response: Response, step: string) {
  const failure = contentTypeCheck(response, 'application/json');
  if (response.status < 400 || failure) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${step}: expected a JSON error response`,
      details: responseDetails(response)
    });
  }
  const input = yield* responseJson(response, `${step}: malformed error JSON`);
  yield* Schema.decodeUnknownEffect(errorSchema)(input).pipe(
    Effect.mapError((): GraderResult => ({ status: 'fail', message: `${step}: expected a non-empty error message`, details: JSON.stringify(input) }))
  );
});

/** Inspect the prescribed form while allowing different IDs, classes, and page layouts. */
export const readFormPage = Effect.fn(function* (response: Response, baseUrl: URL, path: string, fields: Record<string, string[]>) {
  if (response.status !== 200 || contentTypeCheck(response, 'text/html')) {
    return yield* Effect.fail<GraderResult>({ status: 'fail', message: `${path}: expected an HTML page`, details: responseDetails(response) });
  }
  const page = load(yield* responseText(response, `${path}: could not read HTML`));
  let found = false;
  for (const element of page('form').toArray()) {
    const form = page(element);
    if (form.attr('method')?.toUpperCase() !== 'POST') continue;
    const pageUrl = new URL(response.url || projectUrl(baseUrl, path));
    const documentBase = yield* redirectUrl(page('base[href]').first().attr('href') || pageUrl.href, pageUrl);
    const action = yield* redirectUrl(form.attr('action') || pageUrl.href, documentBase);
    if (action.href !== projectUrl(baseUrl, path).href) continue;
    if (
      Object.entries(fields).every(([name, types]) => {
        const input = form
          .find('input')
          .filter((_index, element) => page(element).attr('name') === name)
          .first();
        return input.length && !input.is('[disabled]') && types.includes((input.attr('type') || 'text').toLowerCase());
      })
    ) {
      found = true;
      break;
    }
  }
  if (!found) {
    return yield* Effect.fail<GraderResult>({ status: 'fail', message: `${path}: missing POST form with ${Object.keys(fields).join(', ')} inputs` });
  }
  page('script, style, form, nav').remove();
  return page;
});
