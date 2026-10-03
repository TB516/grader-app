import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseJson } from '../../utils/response-body';
import { parseUsers } from './json-shape';

export const getUsersGetGrader: Grader = {
  label: '/getUsers GET Returns Users JSON',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/getUsers'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'application/json');
      if (failure) return failure;

      const json = yield* responseJson(response, '/getUsers JSON parsing failed');

      yield* parseUsers(json, '/getUsers JSON did not contain a valid user collection');

      return { status: 'pass', message: '/getUsers returned users JSON', details: responseDetails(response) };
    })
};
