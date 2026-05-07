import { t } from 'try';
import type { GraderResult } from '../../../../shared/types';
import { responseDetails } from '../../utils/details';

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; result: GraderResult };

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const parseJsonResponse = async (response: Response, failureMessage: string): Promise<JsonParseResult> => {
  const json = await t(async () => await response.json());

  if (!json.ok) {
    return {
      ok: false,
      result: {
        status: 'fail',
        message: failureMessage,
        details: responseDetails(response)
      }
    };
  }

  return { ok: true, value: json.value };
};

export const hasErrorShape = (value: unknown): boolean => {
  if (!isRecord(value)) return false;

  return typeof value.message === 'string' && value.message.trim().length > 0 && typeof value.id === 'string' && value.id.trim().length > 0;
};

export const hasMessage = (value: unknown): boolean => {
  return isRecord(value) && typeof value.message === 'string' && value.message.trim().length > 0;
};

export const extractUsersPayload = (value: unknown): Record<string, unknown> | null => {
  if (!isRecord(value)) return null;
  if (isRecord(value.users)) return value.users;

  return value;
};

export const findUser = (usersPayload: Record<string, unknown>, name: string): unknown => {
  const keyedUser = usersPayload[name];
  if (keyedUser !== undefined) return keyedUser;

  return Object.values(usersPayload).find((user) => isRecord(user) && user.name === name);
};

export const hasAge = (user: unknown, age: number): boolean => {
  if (!isRecord(user)) return false;

  return user.age === age || user.age === String(age);
};
