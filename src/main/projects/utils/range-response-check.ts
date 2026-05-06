import type { GraderResult } from '../../../shared/types';

export type RangeExpectation = {
  start: number;
  end: number;
};

export const rangeResponseCheck = (response: Response, expected: RangeExpectation): GraderResult | null => {
  const acceptRanges = response.headers.get('Accept-Ranges');
  if (!acceptRanges?.includes('bytes')) {
    return {
      status: 'fail',
      message: 'Accept-Ranges header was not "bytes"',
      details: JSON.stringify(response)
    };
  }

  const contentRange = response.headers.get('Content-Range');
  if (!contentRange) {
    return {
      status: 'fail',
      message: 'Content-Range header was missing',
      details: JSON.stringify(response)
    };
  }

  const match = /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/u.exec(contentRange);
  if (!match) {
    return {
      status: 'fail',
      message: 'Content-Range header was malformed',
      details: contentRange
    };
  }

  const start = Number.parseInt(match[1], 10);
  const end = Number.parseInt(match[2], 10);
  const total = match[3] === '*' ? null : Number.parseInt(match[3], 10);

  if (start !== expected.start) {
    return {
      status: 'fail',
      message: `Content-Range start was not "${expected.start}"`,
      details: contentRange
    };
  }

  if (end < expected.start || end > expected.end) {
    return {
      status: 'fail',
      message: `Content-Range end was not between "${expected.start}" and "${expected.end}"`,
      details: contentRange
    };
  }

  if (total !== null && total <= end) {
    return {
      status: 'fail',
      message: 'Content-Range total size was not greater than the returned range end',
      details: contentRange
    };
  }

  return null;
};
