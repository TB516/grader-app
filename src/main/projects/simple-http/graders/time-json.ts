import { Temporal } from 'temporal-polyfill';
import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { responseDetails } from '../../utils/details';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';
import { parseTimeString } from '../../utils/parse-time-string';
import { projectUrl } from '../../utils/project-url';
import { WIGGLE_ROOM } from './time-text';

export const timeJsonGrader: Grader = {
  label: 'Time JSON Endpoint Returns Correct Time',
  run: async (url) => {
    const expectedTime = Temporal.Now.plainTimeISO('UTC');
    const response = await t(fetch, projectUrl(url, '/timeJSON'));
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'application/json');
    if (failure) return failure;

    const json = await t(async () => await response.value.json());
    if (!json.ok) return { status: 'fail', message: 'JSON parsing failed', details: responseDetails(response.value) };

    if (typeof json.value !== 'object' || json.value === null || typeof json.value.time !== 'string' || Object.keys(json.value).length !== 1) {
      return { status: 'fail', message: 'JSON did not contain a valid "time" string', details: JSON.stringify(json.value) };
    }

    const responseTime = parseTimeString(json.value.time);
    if (!responseTime) return { status: 'fail', message: `Failed to parse time '${json.value.time}'`, details: JSON.stringify(json.value) };

    const diff = Math.abs(responseTime.until(expectedTime).total({ unit: 'seconds' }));
    const wrappedDif = Math.min(diff, 86400 - diff);

    if (wrappedDif >= WIGGLE_ROOM) {
      return {
        status: 'fail',
        message: `JSON time was '${json.value.time}', which is not '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}s`,
        details: JSON.stringify(json.value)
      };
    }

    return {
      status: 'pass',
      message: `JSON time was '${json.value.time}', which is '${expectedTime.toString()}' +/- ${WIGGLE_ROOM}s`,
      details: JSON.stringify(json.value)
    };
  }
};
