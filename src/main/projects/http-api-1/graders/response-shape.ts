import http from 'node:http';
import https from 'node:https';
import { DOMParser, onWarningStopParsing } from '@xmldom/xmldom';
import { t } from 'try';
import { z } from 'zod';
import type { GraderResult } from '../../../../shared/types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { errorDetails, responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

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

/** Requests an API endpoint, omitting Accept entirely for the PDF's default-format check. */
export const fetchWithAccept = async (url: URL, path: string, accept?: string): Promise<Response> => {
  const target = projectUrl(url, path);
  const signal = AbortSignal.timeout(10_000);
  if (accept) return await fetch(target, { headers: { Accept: accept }, signal });

  // fetch adds Accept: */* even when no headers were supplied.
  return await new Promise<Response>((resolve, reject) => {
    const get = target.protocol === 'https:' ? https.get : http.get;
    const request = get(target, { signal }, async (response) => {
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
    request.on('error', reject);
  });
};

const messageSchema = z.looseObject({ message: z.string().trim().min(1) });

export const checkJsonBody = async (response: Response, expectation: ApiExpectation): Promise<GraderResult | null> => {
  const json = await t(async () => await response.json());
  if (!json.ok) return { status: 'fail', message: `${expectation.labelName} JSON parsing failed`, details: responseDetails(response) };

  const body = messageSchema.safeParse(json.value);
  if (!body.success) {
    return {
      status: 'fail',
      message: `${expectation.labelName} JSON body did not include a non-empty message string`,
      details: JSON.stringify(json.value)
    };
  }

  if (expectation.expectedIds) {
    if (typeof body.data.id !== 'string' || !expectation.expectedIds.includes(body.data.id)) {
      return {
        status: 'fail',
        message: `${expectation.labelName} JSON error id was not ${expectation.expectedIds.join(' or ')}`,
        details: JSON.stringify(json.value)
      };
    }
  }

  return null;
};

export const checkXmlBody = async (response: Response, expectation: ApiExpectation): Promise<GraderResult | null> => {
  const text = await t(async () => await response.text());
  if (!text.ok) return { status: 'error', message: `${expectation.labelName} XML text parsing failed`, details: errorDetails(text.error) };

  const document = t(() => new DOMParser({ onError: onWarningStopParsing }).parseFromString(text.value, 'application/xml'));
  if (!document.ok) {
    return { status: 'fail', message: `${expectation.labelName} XML was malformed`, details: text.value };
  }

  const message = document.value.getElementsByTagName('message').item(0)?.textContent?.trim();
  const id = document.value.getElementsByTagName('id').item(0)?.textContent?.trim();
  if (!message) {
    return { status: 'fail', message: `${expectation.labelName} XML body did not include a non-empty message tag`, details: text.value };
  }

  if (expectation.expectedIds && (!id || !expectation.expectedIds.includes(id))) {
    return {
      status: 'fail',
      message: `${expectation.labelName} XML error id was not ${expectation.expectedIds.join(' or ')}`,
      details: text.value
    };
  }

  return null;
};

export const checkJsonResponse = async (response: Response, expectation: ApiExpectation): Promise<GraderResult | null> => {
  let failure = httpStatusCheck(response, expectation.expectedStatus);
  if (failure) return failure;

  failure = contentTypeCheck(response, 'application/json');
  if (failure) return failure;

  return await checkJsonBody(response, expectation);
};

export const checkXmlResponse = async (response: Response, expectation: ApiExpectation): Promise<GraderResult | null> => {
  const failure = httpStatusCheck(response, expectation.expectedStatus);
  if (failure) return failure;

  const contentType = response.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'text/xml' && contentType !== 'application/xml') {
    return {
      status: 'fail',
      message: 'Content-Type header was not "text/xml" or "application/xml"',
      details: responseDetails(response)
    };
  }

  return await checkXmlBody(response, expectation);
};
