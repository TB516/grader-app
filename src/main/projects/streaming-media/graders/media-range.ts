import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { rangeResponseCheck } from '../../utils/range-response-check';
import { request } from '../../utils/request';
import { responseBytes } from '../../utils/response-body';

type SignatureCheck = (buffer: Uint8Array) => boolean;

type MediaRangeGraderOptions = {
  label: string;
  path: string;
  expectedContentType: string;
  passMessage: string;
  signatureFailureMessage: string;
  signatureCheck: SignatureCheck;
};

const rangeStart = 0;
const rangeEnd = 15;

export const mediaRangeGrader = ({
  label,
  path,
  expectedContentType,
  passMessage,
  signatureFailureMessage,
  signatureCheck
}: MediaRangeGraderOptions): Grader => ({
  label,
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, path), {
        headers: {
          Range: `bytes=${rangeStart}-${rangeEnd}`
        }
      });

      let failure = httpStatusCheck(response, 206);
      if (failure) return failure;

      failure = rangeResponseCheck(response, { start: rangeStart, end: rangeEnd });
      if (failure) return failure;

      failure = contentTypeCheck(response, expectedContentType);
      if (failure) return failure;

      const buffer = yield* responseBytes(response, 'Media parsing failed');
      if (buffer.length === 0) return { status: 'fail', message: 'Media body was empty', details: JSON.stringify(response) };

      const contentLength = response.headers.get('Content-Length');
      const parsedContentLength = contentLength ? Number.parseInt(contentLength, 10) : Number.NaN;
      if (!Number.isFinite(parsedContentLength) || parsedContentLength <= 0) {
        return {
          status: 'fail',
          message: 'Content-Length header was not a positive number',
          details: contentLength ?? ''
        };
      }

      if (parsedContentLength !== buffer.length) {
        return {
          status: 'fail',
          message: 'Content-Length header did not match the returned byte count',
          details: JSON.stringify({ contentLength: parsedContentLength, byteCount: buffer.length })
        };
      }

      if (!signatureCheck(buffer)) {
        return {
          status: 'fail',
          message: signatureFailureMessage,
          details: JSON.stringify([...buffer.slice(0, rangeEnd + 1)])
        };
      }

      return { status: 'pass', message: passMessage, details: JSON.stringify(response) };
    })
});

export const mp4SignatureCheck = (buffer: Uint8Array): boolean => {
  return buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
};

export const mp3SignatureCheck = (buffer: Uint8Array): boolean => {
  const hasId3Tag = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33;
  const hasFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;

  return hasId3Tag || hasFrameSync;
};
