import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { rangeResponseCheck } from '../../utils/range-response-check';

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
  run: async (url) => {
    const response = await t(fetch, projectUrl(url, path), {
      headers: {
        Range: `bytes=${rangeStart}-${rangeEnd}`
      }
    });
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 206);
    if (failure) return failure;

    failure = rangeResponseCheck(response.value, { start: rangeStart, end: rangeEnd });
    if (failure) return failure;

    failure = contentTypeCheck(response.value, expectedContentType);
    if (failure) return failure;

    const buffer = await t(async () => new Uint8Array(await response.value.arrayBuffer()));
    if (!buffer.ok) return { status: 'error', message: 'Media parsing failed', details: JSON.stringify(buffer.error) };
    if (buffer.value.length === 0) return { status: 'fail', message: 'Media body was empty', details: JSON.stringify(response.value) };

    const contentLength = response.value.headers.get('Content-Length');
    const parsedContentLength = contentLength ? Number.parseInt(contentLength, 10) : Number.NaN;
    if (!Number.isFinite(parsedContentLength) || parsedContentLength <= 0) {
      return {
        status: 'fail',
        message: 'Content-Length header was not a positive number',
        details: contentLength ?? ''
      };
    }

    if (parsedContentLength !== buffer.value.length) {
      return {
        status: 'fail',
        message: 'Content-Length header did not match the returned byte count',
        details: JSON.stringify({ contentLength: parsedContentLength, byteCount: buffer.value.length })
      };
    }

    if (!signatureCheck(buffer.value)) {
      return {
        status: 'fail',
        message: signatureFailureMessage,
        details: JSON.stringify([...buffer.value.slice(0, rangeEnd + 1)])
      };
    }

    return { status: 'pass', message: passMessage, details: JSON.stringify(response.value) };
  }
});

export const mp4SignatureCheck = (buffer: Uint8Array): boolean => {
  return buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
};

export const mp3SignatureCheck = (buffer: Uint8Array): boolean => {
  const hasId3Tag = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33;
  const hasFrameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;

  return hasId3Tag || hasFrameSync;
};
