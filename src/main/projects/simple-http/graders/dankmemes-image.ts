import { t } from 'try';
import type { Grader } from '../../../types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { fetchErrorResult } from '../../utils/fetch-error-result';
import { httpStatusCheck } from '../../utils/http-status-check';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

export const dankmemesImageGrader: Grader = {
  label: 'Dankmemes Endpoint Returns PNG',
  run: async (url) => {
    const response = await t(fetch, `${url}/dankmemes`);
    if (!response.ok) return fetchErrorResult(response.error);

    let failure = httpStatusCheck(response.value, 200);
    if (failure) return failure;

    failure = contentTypeCheck(response.value, 'image/png');
    if (failure) return failure;

    const buffer = await t(async () => new Uint8Array(await response.value.arrayBuffer()));
    if (!buffer.ok) return { status: 'error', message: 'Image parsing failed', details: JSON.stringify(buffer.error) };
    if (buffer.value.length === 0) return { status: 'fail', message: 'Image body was empty', details: JSON.stringify(response.value) };

    const isPng = PNG_SIGNATURE.every((byte, index) => buffer.value[index] === byte);
    if (!isPng) return { status: 'fail', message: 'Image body was not a PNG file', details: JSON.stringify([...buffer.value.slice(0, 8)]) };

    return { status: 'pass', message: 'Dankmemes endpoint returned a PNG image', details: JSON.stringify(response.value) };
  }
};
