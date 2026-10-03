import { Effect } from 'effect';
import type { GraderResult } from '../../../shared/types';
import { responseDetails } from './details';

export type RangeExpectation = {
  start: number;
  end?: number;
};

/** Validate the requested interval and expose its declared size for body and seek checks. */
export const rangeResponseCheck = Effect.fn(function* (response: Response, expected: RangeExpectation) {
  const acceptRanges = response.headers.get('Accept-Ranges');
  if (acceptRanges?.trim().toLowerCase() !== 'bytes') {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: 'Accept-Ranges header was not "bytes"',
      details: responseDetails(response)
    });
  }

  const contentRange = response.headers.get('Content-Range');
  if (!contentRange) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: 'Content-Range header was missing',
      details: responseDetails(response)
    });
  }

  const match = /^bytes\s+(\d+)-(\d+)\/(\d+)$/iu.exec(contentRange);
  if (!match) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: 'Content-Range header was malformed',
      details: contentRange
    });
  }

  const start = Number.parseInt(match[1], 10);
  const end = Number.parseInt(match[2], 10);
  const total = Number(match[3]);

  if (start !== expected.start) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `Content-Range start was not "${expected.start}"`,
      details: contentRange
    });
  }

  const expectedEnd = Math.min(expected.end ?? total - 1, total - 1);
  if (end !== expectedEnd || end < start) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `Content-Range end was not "${expectedEnd}"`,
      details: contentRange
    });
  }

  if (![start, end, total].every(Number.isSafeInteger) || total <= end) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: 'Content-Range total size was not greater than the returned range end',
      details: contentRange
    });
  }

  return { start, end, total };
});
