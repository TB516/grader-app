import { Temporal } from 'temporal-polyfill';
import type { GraderResult } from '../../../../shared/types';
import { parseTimeString } from '../../utils/parse-time-string';

const timeZones = ['UTC', ...Intl.supportedValuesOf('timeZone')];

/** The PDF uses Date.getHours(), so the server's time zone need not match ours or UTC. */
export const timeCheck = (text: string): GraderResult | null => {
  const time = parseTimeString(text);
  if (!time) return { status: 'fail', message: `Failed to parse time '${text}'` };

  const now = Temporal.Now.instant();
  const current = timeZones.some((zone) => {
    const expected = now.toZonedDateTimeISO(zone).toPlainTime();
    const difference = Math.abs(time.until(expected).total({ unit: 'seconds' }));
    return Math.min(difference, 86400 - difference) < 60;
  });
  if (!current) return { status: 'fail', message: `Time '${text}' was not within 60 seconds of the current time in any supported time zone` };
  return null;
};
