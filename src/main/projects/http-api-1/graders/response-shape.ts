import { t } from 'try';
import type { GraderResult } from '../../../../shared/types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { errorDetails, responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';

export type ApiFormat = 'json' | 'xml';

export type ApiExpectation = {
  path: string;
  labelName: string;
  expectedStatus: number;
  expectedId?: string;
  query?: string;
};

export const apiExpectations: ApiExpectation[] = [
  { path: '/success', labelName: 'Success', expectedStatus: 200 },
  { path: '/badRequest', labelName: 'Bad Request', expectedStatus: 400, expectedId: 'badRequest' },
  { path: '/badRequest?valid=true', labelName: 'Bad Request Valid Query', expectedStatus: 200 },
  { path: '/unauthorized', labelName: 'Unauthorized', expectedStatus: 401, expectedId: 'unauthorized' },
  { path: '/unauthorized?loggedIn=yes', labelName: 'Unauthorized Logged In Query', expectedStatus: 200 },
  { path: '/forbidden', labelName: 'Forbidden', expectedStatus: 403, expectedId: 'forbidden' },
  { path: '/internal', labelName: 'Internal', expectedStatus: 500, expectedId: 'internalError' },
  { path: '/notImplemented', labelName: 'Not Implemented', expectedStatus: 501, expectedId: 'notImplemented' },
  { path: '/__grader_unknown_route__', labelName: 'Unknown Route', expectedStatus: 404, expectedId: 'notFound' }
];

export const fetchWithAccept = async (url: URL, path: string, accept?: string): Promise<Response> => {
  return await fetch(projectUrl(url, path), accept ? { headers: { Accept: accept } } : undefined);
};

const hasTextMessage = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const checkJsonBody = async (response: Response, expectation: ApiExpectation): Promise<GraderResult | null> => {
  const json = await t(async () => await response.json());
  if (!json.ok) return { status: 'fail', message: `${expectation.labelName} JSON parsing failed`, details: responseDetails(response) };

  const value = json.value;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { status: 'fail', message: `${expectation.labelName} JSON body was not an object`, details: JSON.stringify(value) };
  }

  const body = value as Record<string, unknown>;
  if (!hasTextMessage(body.message)) {
    return {
      status: 'fail',
      message: `${expectation.labelName} JSON body did not include a non-empty message string`,
      details: JSON.stringify(value)
    };
  }

  if (expectation.expectedId) {
    if (body.id !== expectation.expectedId) {
      return {
        status: 'fail',
        message: `${expectation.labelName} JSON error id was not "${expectation.expectedId}"`,
        details: JSON.stringify(value)
      };
    }
  } else if ('id' in body) {
    return { status: 'fail', message: `${expectation.labelName} JSON success body included an id field`, details: JSON.stringify(value) };
  }

  return null;
};

export const extractSimpleXmlFields = (text: string): { message?: string; id?: string } => {
  return {
    message: text.match(/<message\b[^>]*>([\s\S]*?)<\/message>/i)?.[1]?.trim(),
    id: text.match(/<id\b[^>]*>([\s\S]*?)<\/id>/i)?.[1]?.trim()
  };
};

export const checkXmlBody = async (response: Response, expectation: ApiExpectation): Promise<GraderResult | null> => {
  const text = await t(async () => await response.text());
  if (!text.ok) return { status: 'error', message: `${expectation.labelName} XML text parsing failed`, details: errorDetails(text.error) };

  const fields = extractSimpleXmlFields(text.value);
  if (!hasTextMessage(fields.message)) {
    return { status: 'fail', message: `${expectation.labelName} XML body did not include a non-empty message tag`, details: text.value };
  }

  if (expectation.expectedId && fields.id !== expectation.expectedId) {
    return {
      status: 'fail',
      message: `${expectation.labelName} XML error id was not "${expectation.expectedId}"`,
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

  if (!response.headers.get('Content-Type')?.includes('text/xml') && !response.headers.get('Content-Type')?.includes('application/xml')) {
    return {
      status: 'fail',
      message: 'Content-Type header was not "text/xml" or "application/xml"',
      details: responseDetails(response)
    };
  }

  return await checkXmlBody(response, expectation);
};
