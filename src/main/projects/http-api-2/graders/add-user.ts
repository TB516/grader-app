import { randomUUID } from 'node:crypto';
import { Effect, Result, Schema } from 'effect';
import type { Scope } from 'effect';
import type { GraderResult } from '../../../../shared/types';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseBytes, responseJson } from '../../utils/response-body';
import { errorSchema, messageSchema, parseUsers } from './json-shape';

type SubmissionTransport = 'body' | 'query';

const postUser = Effect.fn(function* (url: URL, fields: Record<string, string>, transport: SubmissionTransport) {
  const target = projectUrl(url, '/addUser');
  const data = new URLSearchParams(fields);
  if (transport === 'query') target.search = data.toString();

  return yield* request(target, {
    method: 'POST',
    body: transport === 'body' ? data : undefined
  });
});

const checkUserAge = Effect.fn(function* (url: URL, name: string, age: number): Effect.fn.Return<void, GraderResult, Scope.Scope> {
  const response = yield* request(projectUrl(url, '/getUsers'));
  const failure = httpStatusCheck(response, 200) ?? contentTypeCheck(response, 'application/json');
  if (failure) return yield* Effect.fail(failure);

  const json = yield* responseJson(response, '/getUsers JSON parsing failed');

  const users = yield* parseUsers(json, '/getUsers did not return a valid user collection');

  const user = users.find((user) => user.name === name);
  if (!user || user.age !== age) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `/getUsers did not contain ${name} with age ${age}`,
      details: JSON.stringify(json)
    });
  }
});

const checkUserLifecycle = Effect.fn(function* (url: URL): Effect.fn.Return<GraderResult, GraderResult, Scope.Scope> {
  const name = `grader_${randomUUID()}`;
  let transport: SubmissionTransport = 'body';
  let createResponse = yield* postUser(url, { name, age: '21' }, transport);

  // The PDF specifies POST but does not require body or query parameters.
  // Detect the supported transport once, then use it for every remaining check.
  if (createResponse.status === 400 || createResponse.status === 415) {
    yield* responseBytes(createResponse, 'Create user response parsing failed');
    transport = 'query';
    createResponse = yield* postUser(url, { name, age: '21' }, transport);
  }

  let failure = httpStatusCheck(createResponse, 201) ?? contentTypeCheck(createResponse, 'application/json');
  if (failure) return { ...failure, message: `Create user: ${failure.message}` };

  let json = yield* responseJson(createResponse, 'Create user JSON parsing failed');
  if (Result.isFailure(Schema.decodeUnknownResult(messageSchema)(json))) {
    return { status: 'fail', message: 'Create user JSON did not contain a non-empty message', details: JSON.stringify(json) };
  }

  yield* checkUserAge(url, name, 21).pipe(Effect.mapError((failure) => ({ ...failure, message: `Confirm created user: ${failure.message}` })));

  const invalidCases: { label: string; fields: Record<string, string> }[] = [
    { label: 'Missing name and age', fields: {} },
    { label: 'Missing name', fields: { age: '21' } },
    { label: 'Missing age', fields: { name } },
    { label: 'Empty name', fields: { name: '', age: '21' } },
    { label: 'Empty age', fields: { name, age: '' } }
  ];
  for (const { label, fields } of invalidCases) {
    const response = yield* postUser(url, fields, transport);
    failure = httpStatusCheck(response, 400) ?? contentTypeCheck(response, 'application/json');
    if (failure) return { ...failure, message: `${label}: ${failure.message}` };

    json = yield* responseJson(response, `${label}: JSON parsing failed`);
    if (Result.isFailure(Schema.decodeUnknownResult(errorSchema)(json))) {
      return { status: 'fail', message: `${label}: JSON did not contain non-empty message and id fields`, details: JSON.stringify(json) };
    }
  }

  yield* checkUserAge(url, name, 21).pipe(
    Effect.mapError((failure) => ({ ...failure, message: `Invalid requests changed the existing user: ${failure.message}` }))
  );

  const updateResponse = yield* postUser(url, { name, age: '22' }, transport);
  failure = httpStatusCheck(updateResponse, 204);
  if (failure) return { ...failure, message: `Update user: ${failure.message}` };

  yield* checkUserAge(url, name, 22).pipe(Effect.mapError((failure) => ({ ...failure, message: `Confirm updated user: ${failure.message}` })));

  return { status: 'pass', message: `/addUser created, updated, and rejected invalid users using ${transport} parameters` };
});

export const addUserGrader: Grader = {
  label: '/addUser POST Creates Updates And Validates Users',
  run: checkUserLifecycle
};
