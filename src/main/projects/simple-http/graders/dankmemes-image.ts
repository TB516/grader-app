import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseBytes } from '../../utils/response-body';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

export const dankmemesImageGrader: Grader = {
  label: 'Dankmemes Endpoint Returns PNG',
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, '/dankmemes'));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'image/png');
      if (failure) return failure;

      const buffer = yield* responseBytes(response, 'Image parsing failed');
      if (buffer.length === 0) return { status: 'fail', message: 'Image body was empty', details: responseDetails(response) };

      const isPng = PNG_SIGNATURE.every((byte, index) => buffer[index] === byte);
      if (!isPng) return { status: 'fail', message: 'Image body was not a PNG file', details: JSON.stringify([...buffer.slice(0, 8)]) };

      return { status: 'pass', message: 'Dankmemes endpoint returned a PNG image', details: responseDetails(response) };
    })
};
