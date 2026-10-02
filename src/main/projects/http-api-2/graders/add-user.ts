import { randomUUID } from 'node:crypto';
import { t } from 'try';
import type { GraderResult } from '../../../../shared/types';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { errorSchema, messageSchema, parseJsonResponse, usersSchema } from './json-shape';

type SubmissionTransport = 'body' | 'query';

const postUser = async (url: URL, fields: Record<string, string>, transport: SubmissionTransport): Promise<Response> => {
  const target = projectUrl(url, '/addUser');
  const data = new URLSearchParams(fields);
  if (transport === 'query') target.search = data.toString();

  return await fetch(target, {
    method: 'POST',
    body: transport === 'body' ? data : undefined,
    signal: AbortSignal.timeout(10_000)
  });
};

const checkUserAge = async (url: URL, name: string, age: number): Promise<GraderResult | null> => {
  const response = await fetch(projectUrl(url, '/getUsers'), { signal: AbortSignal.timeout(10_000) });
  const failure = httpStatusCheck(response, 200) ?? contentTypeCheck(response, 'application/json');
  if (failure) return failure;

  const json = await parseJsonResponse(response, '/getUsers JSON parsing failed');
  if (!json.ok) return json.result;

  const users = usersSchema.safeParse(json.value);
  if (!users.success) {
    return { status: 'fail', message: '/getUsers did not return a valid user collection', details: JSON.stringify(json.value) };
  }

  const user = users.data.find((user) => user.name === name);
  if (!user || user.age !== age) {
    return { status: 'fail', message: `/getUsers did not contain ${name} with age ${age}`, details: JSON.stringify(json.value) };
  }
  return null;
};

const checkUserLifecycle = async (url: URL): Promise<GraderResult> => {
  const name = `grader_${randomUUID()}`;
  let transport: SubmissionTransport = 'body';
  let createResponse = await postUser(url, { name, age: '21' }, transport);

  // The PDF specifies POST but does not require body or query parameters.
  // Detect the supported transport once, then use it for every remaining check.
  if (createResponse.status === 400 || createResponse.status === 415) {
    await createResponse.arrayBuffer();
    transport = 'query';
    createResponse = await postUser(url, { name, age: '21' }, transport);
  }

  let failure = httpStatusCheck(createResponse, 201) ?? contentTypeCheck(createResponse, 'application/json');
  if (failure) return { ...failure, message: `Create user: ${failure.message}` };

  let json = await parseJsonResponse(createResponse, 'Create user JSON parsing failed');
  if (!json.ok) return json.result;
  if (!messageSchema.safeParse(json.value).success) {
    return { status: 'fail', message: 'Create user JSON did not contain a non-empty message', details: JSON.stringify(json.value) };
  }

  failure = await checkUserAge(url, name, 21);
  if (failure) return { ...failure, message: `Confirm created user: ${failure.message}` };

  const invalidCases: { label: string; fields: Record<string, string> }[] = [
    { label: 'Missing name and age', fields: {} },
    { label: 'Missing name', fields: { age: '21' } },
    { label: 'Missing age', fields: { name } },
    { label: 'Empty name', fields: { name: '', age: '21' } },
    { label: 'Empty age', fields: { name, age: '' } }
  ];
  for (const { label, fields } of invalidCases) {
    const response = await postUser(url, fields, transport);
    failure = httpStatusCheck(response, 400) ?? contentTypeCheck(response, 'application/json');
    if (failure) return { ...failure, message: `${label}: ${failure.message}` };

    json = await parseJsonResponse(response, `${label}: JSON parsing failed`);
    if (!json.ok) return json.result;
    if (!errorSchema.safeParse(json.value).success) {
      return { status: 'fail', message: `${label}: JSON did not contain non-empty message and id fields`, details: JSON.stringify(json.value) };
    }
  }

  failure = await checkUserAge(url, name, 21);
  if (failure) return { ...failure, message: `Invalid requests changed the existing user: ${failure.message}` };

  const updateResponse = await postUser(url, { name, age: '22' }, transport);
  failure = httpStatusCheck(updateResponse, 204);
  if (failure) return { ...failure, message: `Update user: ${failure.message}` };

  failure = await checkUserAge(url, name, 22);
  if (failure) return { ...failure, message: `Confirm updated user: ${failure.message}` };

  return { status: 'pass', message: `/addUser created, updated, and rejected invalid users using ${transport} parameters` };
};

export const addUserGrader: Grader = {
  label: '/addUser POST Creates Updates And Validates Users',
  run: async (url) => {
    const result = await t(checkUserLifecycle, url);
    if (!result.ok) return fetchErrorResult(result.error);
    return result.value;
  }
};
