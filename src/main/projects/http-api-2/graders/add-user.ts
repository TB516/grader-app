import { t } from 'try';
import type { GraderResult } from '../../../../shared/types';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { errorDetails, responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { extractUsersPayload, findUser, hasAge, hasErrorShape, hasMessage, parseJsonResponse } from './json-shape';

const formBody = (entries: Record<string, string>): URLSearchParams => {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(entries)) {
    body.set(key, value);
  }

  return body;
};

const postUser = async (url: URL, body: URLSearchParams): Promise<Response | GraderResult> => {
  const response = await t(fetch, projectUrl(url, '/addUser'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) return fetchErrorResult(response.error);

  return response.value;
};

const getUsers = async (url: URL): Promise<Response | GraderResult> => {
  const response = await t(fetch, projectUrl(url, '/getUsers'));
  if (!response.ok) return fetchErrorResult(response.error);

  return response.value;
};

const isGraderResult = (value: Response | GraderResult): value is GraderResult => {
  return !(value instanceof Response);
};

const checkJsonContentType = (response: Response, step: string): GraderResult | null => {
  const failure = contentTypeCheck(response, 'application/json');
  if (!failure) return null;

  return { ...failure, message: `${step}: ${failure.message}` };
};

const checkUserAge = async (url: URL, name: string, age: number, step: string): Promise<GraderResult | null> => {
  const response = await getUsers(url);
  if (isGraderResult(response)) return response;

  let failure = httpStatusCheck(response, 200);
  if (failure) return { ...failure, message: `${step}: ${failure.message}` };

  failure = checkJsonContentType(response, step);
  if (failure) return failure;

  const json = await parseJsonResponse(response, `${step}: /getUsers JSON parsing failed`);
  if (!json.ok) return json.result;

  const usersPayload = extractUsersPayload(json.value);
  if (!usersPayload) {
    return {
      status: 'fail',
      message: `${step}: /getUsers JSON did not contain a usable users object`,
      details: JSON.stringify(json.value)
    };
  }

  const user = findUser(usersPayload, name);
  if (!user) {
    return {
      status: 'fail',
      message: `${step}: Created user was not found in /getUsers response`,
      details: JSON.stringify(json.value)
    };
  }

  if (!hasAge(user, age)) {
    return {
      status: 'fail',
      message: `${step}: User age was not updated to ${age}`,
      details: JSON.stringify(user)
    };
  }

  return null;
};

export const addUserGrader: Grader = {
  label: '/addUser POST Creates Updates And Validates Users',
  run: async (url) => {
    const name = `__grader_user_${Date.now()}`;

    const invalidResponse = await postUser(url, formBody({}));
    if (isGraderResult(invalidResponse)) return invalidResponse;

    let failure = httpStatusCheck(invalidResponse, 400);
    if (failure) return { ...failure, message: `Invalid add user did not return 400: ${failure.message}` };

    failure = checkJsonContentType(invalidResponse, 'Invalid add user');
    if (failure) return failure;

    let json = await parseJsonResponse(invalidResponse, 'Invalid add user JSON parsing failed');
    if (!json.ok) return json.result;

    if (!hasErrorShape(json.value)) {
      return {
        status: 'fail',
        message: 'Invalid add user JSON did not contain non-empty message and id fields',
        details: JSON.stringify(json.value)
      };
    }

    const createResponse = await postUser(url, formBody({ name, age: '21' }));
    if (isGraderResult(createResponse)) return createResponse;

    failure = httpStatusCheck(createResponse, 201);
    if (failure) return { ...failure, message: `Create user did not return 201: ${failure.message}` };

    failure = checkJsonContentType(createResponse, 'Create user');
    if (failure) return failure;

    json = await parseJsonResponse(createResponse, 'Create user JSON parsing failed');
    if (!json.ok) return json.result;

    if (!hasMessage(json.value)) {
      return {
        status: 'fail',
        message: 'Create user JSON did not contain a non-empty message field',
        details: JSON.stringify(json.value)
      };
    }

    failure = await checkUserAge(url, name, 21, 'Confirm created user');
    if (failure) return failure;

    const updateResponse = await postUser(url, formBody({ name, age: '22' }));
    if (isGraderResult(updateResponse)) return updateResponse;

    failure = httpStatusCheck(updateResponse, 204);
    if (failure) return { ...failure, message: `Update user did not return 204: ${failure.message}` };

    const updateText = await t(async () => await updateResponse.text());
    if (!updateText.ok) return { status: 'error', message: 'Update user body parsing failed', details: errorDetails(updateText.error) };
    if (updateText.value.length > 0) return { status: 'fail', message: 'Update user 204 response had a body', details: updateText.value };

    failure = await checkUserAge(url, name, 22, 'Confirm updated user');
    if (failure) return failure;

    return { status: 'pass', message: '/addUser created, updated, and rejected invalid users correctly', details: responseDetails(updateResponse) };
  }
};
