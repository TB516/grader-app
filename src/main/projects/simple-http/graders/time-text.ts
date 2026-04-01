import { Temporal } from 'temporal-polyfill';
import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { parseTimeString } from '../../utils/parse-time-string';

export const WIGGLE_ROOM = 60;

export const timeTextGrader: Grader = {
  label: 'Time Endpoint Returns Correct Time',
  run: async (url) => {
    const expectedTime = Temporal.Now.plainTimeISO('UTC');
    const response = await t(fetch, url);
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'text/plain');
    if (failure) return failure;

    const text = await t(async () => await response.value.text());
    if (!text.ok) return { status: 'error', message: 'Text parsing failed', details: JSON.stringify(text.error) };

    const responseTime = parseTimeString(text.value);
    if (!responseTime) return { status: 'fail', message: `Failed to parse time '${text.value}'`, details: JSON.stringify(response.value) };

    const diff = Math.abs(responseTime.until(expectedTime).total({ unit: 'seconds' }));
    const wrappedDif = Math.min(diff, 86400 - diff);

    if (wrappedDif >= WIGGLE_ROOM)
      return {
        status: 'fail',
        message: `Text was '${text.value}', which is not '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}s`,
        details: JSON.stringify(response)
      };

    return {
      status: 'pass',
      message: `Text was '${text.value}', which is '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}`,
      details: JSON.stringify(response)
    };
  }
};
