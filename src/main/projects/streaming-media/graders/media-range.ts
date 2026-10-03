import { Effect } from 'effect';
import type { GraderResult } from '../../../../shared/types';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { rangeResponseCheck, type RangeExpectation } from '../../utils/range-response-check';
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

const readRange = Effect.fn(function* (url: URL, expectedContentType: string, range: RangeExpectation) {
  const response = yield* request(url, { headers: { Range: `bytes=${range.start}-${range.end ?? ''}` } });
  const failure = httpStatusCheck(response, 206) ?? contentTypeCheck(response, expectedContentType);
  if (failure) return yield* Effect.fail(failure);
  const interval = yield* rangeResponseCheck(response, range);
  const bytes = yield* responseBytes(response, 'Media parsing failed');
  const length = response.headers.get('Content-Length');
  if (!length || !/^\d+$/u.test(length) || Number(length) !== bytes.length || bytes.length !== interval.end - interval.start + 1) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: 'Content-Length, Content-Range, and the returned byte count did not agree',
      details: JSON.stringify({ contentLength: length, ...interval, byteCount: bytes.length })
    });
  }
  return { bytes, ...interval };
});

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
      const target = projectUrl(url, path);
      const first = yield* readRange(target, expectedContentType, { start: 0, end: 15 });
      if (!signatureCheck(first.bytes)) {
        return {
          status: 'fail',
          message: signatureFailureMessage,
          details: JSON.stringify([...first.bytes])
        };
      }

      // Independent requests must seek correctly, including an omitted end position.
      // Overlapping bytes catch servers that change headers but always send the file start.
      const [overlap, tail] = yield* Effect.all(
        [
          readRange(target, expectedContentType, { start: 4, end: first.end }),
          readRange(target, expectedContentType, { start: Math.max(0, first.total - 8) })
        ],
        { concurrency: 2 }
      );
      if (overlap.total !== first.total || tail.total !== first.total || !overlap.bytes.every((byte, index) => byte === first.bytes[index + 4])) {
        return { status: 'fail', message: 'Seeking returned inconsistent file sizes or bytes' };
      }

      // The PDF allows a missing Range header to start at zero or return 416.
      // Inspect headers here; the scope releases the potentially large unread body.
      const direct = yield* request(target);
      if (direct.status !== 416) {
        if (direct.status !== 200 && direct.status !== 206) return { status: 'fail', message: 'A request without Range must return media or 416' };
        const failure = contentTypeCheck(direct, expectedContentType);
        if (failure) return failure;
        if (direct.status === 206) yield* rangeResponseCheck(direct, { start: 0 });
      }
      return { status: 'pass', message: passMessage };
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
