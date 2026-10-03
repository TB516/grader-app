import { Result } from 'effect';
import { Temporal } from 'temporal-polyfill';

export const parseTimeString = (input: string): Temporal.PlainTime | null => {
  const result = Result.try(() => Temporal.PlainTime.from(input));
  if (Result.isSuccess(result)) return result.success;

  if (!/^\d{1,2}:\d{1,2}:\d{1,2}$/u.test(input)) return null;
  const parts = input.split(':');

  const [h, m, s] = parts.map(Number);

  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59 || !Number.isInteger(s) || s < 0 || s > 59) {
    return null;
  }

  return new Temporal.PlainTime(h, m, s);
};
