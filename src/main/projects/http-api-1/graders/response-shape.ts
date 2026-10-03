import { DOMParser, onWarningStopParsing } from '@xmldom/xmldom';
import { Effect, Result, Schema } from 'effect';
import type { GraderResult } from '../../../../shared/types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request, requestWithoutAccept } from '../../utils/request';
import { responseJson, responseText } from '../../utils/response-body';

export type ApiExpectation = {
  path: string;
  labelName: string;
  expectedStatus: number;
  expectedIds?: string[];
};

export const apiExpectations: ApiExpectation[] = [
  { path: '/success', labelName: 'Success', expectedStatus: 200 },
  { path: '/badRequest', labelName: 'Bad Request', expectedStatus: 400, expectedIds: ['badRequest'] },
  { path: '/badRequest?valid=false', labelName: 'Bad Request Invalid Query', expectedStatus: 400, expectedIds: ['badRequest'] },
  { path: '/badRequest?valid=true', labelName: 'Bad Request Valid Query', expectedStatus: 200 },
  { path: '/unauthorized', labelName: 'Unauthorized', expectedStatus: 401, expectedIds: ['unauthorized'] },
  { path: '/unauthorized?loggedIn=no', labelName: 'Unauthorized Invalid Query', expectedStatus: 401, expectedIds: ['unauthorized'] },
  { path: '/unauthorized?loggedIn=yes', labelName: 'Unauthorized Logged In Query', expectedStatus: 200 },
  { path: '/forbidden', labelName: 'Forbidden', expectedStatus: 403, expectedIds: ['forbidden'] },
  // The PDF example uses internalError; internalServerError spells out the status name.
  { path: '/internal', labelName: 'Internal', expectedStatus: 500, expectedIds: ['internalError', 'internalServerError'] },
  { path: '/notImplemented', labelName: 'Not Implemented', expectedStatus: 501, expectedIds: ['notImplemented'] },
  { path: '/__grader_unknown_route__', labelName: 'Unknown Route', expectedStatus: 404, expectedIds: ['notFound'] }
];

/** The default-format check must omit Accept entirely. */
export const fetchWithAccept = Effect.fn(function* (url: URL, path: string, accept?: string) {
  const target = projectUrl(url, path);
  if (accept) return yield* request(target, { headers: { Accept: accept } });
  return yield* requestWithoutAccept(target);
});

const messageSchema = Schema.Struct({ message: Schema.Trim.check(Schema.isNonEmpty()), id: Schema.optional(Schema.Unknown) });

export const checkJsonBody = Effect.fn(function* (response: Response, expectation: ApiExpectation): Effect.fn.Return<void, GraderResult> {
  const json = yield* responseJson(response, `${expectation.labelName} JSON parsing failed`);

  const body = Schema.decodeUnknownResult(messageSchema)(json);
  if (Result.isFailure(body)) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${expectation.labelName} JSON body did not include a non-empty message string`,
      details: JSON.stringify(json)
    });
  }

  if (expectation.expectedIds) {
    if (typeof body.success.id !== 'string' || !expectation.expectedIds.includes(body.success.id)) {
      return yield* Effect.fail<GraderResult>({
        status: 'fail',
        message: `${expectation.labelName} JSON error id was not ${expectation.expectedIds.join(' or ')}`,
        details: JSON.stringify(json)
      });
    }
  }
});

export const checkXmlBody = Effect.fn(function* (response: Response, expectation: ApiExpectation): Effect.fn.Return<void, GraderResult> {
  const text = yield* responseText(response, `${expectation.labelName} XML text parsing failed`);

  const document = yield* Effect.try({
    try: () => new DOMParser({ onError: onWarningStopParsing }).parseFromString(text, 'application/xml'),
    catch: (): GraderResult => ({ status: 'fail', message: `${expectation.labelName} XML was malformed`, details: text })
  });

  const message = document.getElementsByTagName('message').item(0)?.textContent?.trim();
  const id = document.getElementsByTagName('id').item(0)?.textContent?.trim();
  if (!message) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${expectation.labelName} XML body did not include a non-empty message tag`,
      details: text
    });
  }

  if (expectation.expectedIds && (!id || !expectation.expectedIds.includes(id))) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${expectation.labelName} XML error id was not ${expectation.expectedIds.join(' or ')}`,
      details: text
    });
  }
});

export const checkJsonResponse = Effect.fn(function* (response: Response, expectation: ApiExpectation): Effect.fn.Return<void, GraderResult> {
  let failure = httpStatusCheck(response, expectation.expectedStatus);
  if (failure) return yield* Effect.fail(failure);

  failure = contentTypeCheck(response, 'application/json');
  if (failure) return yield* Effect.fail(failure);

  return yield* checkJsonBody(response, expectation);
});

export const checkXmlResponse = Effect.fn(function* (response: Response, expectation: ApiExpectation): Effect.fn.Return<void, GraderResult> {
  const failure = httpStatusCheck(response, expectation.expectedStatus);
  if (failure) return yield* Effect.fail(failure);

  const contentType = response.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'text/xml' && contentType !== 'application/xml') {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: 'Content-Type header was not "text/xml" or "application/xml"',
      details: responseDetails(response)
    });
  }

  return yield* checkXmlBody(response, expectation);
});
