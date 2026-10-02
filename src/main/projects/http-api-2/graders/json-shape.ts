import { t } from 'try';
import { z } from 'zod';
import type { GraderResult } from '../../../../shared/types';
import { responseDetails } from '../../utils/details';

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; result: GraderResult };

export const messageSchema = z.object({ message: z.string().trim().min(1) });
export const errorSchema = messageSchema.extend({ id: z.string().trim().min(1) });

const userSchema = z.object({
  name: z.string().optional(),
  age: z.union([z.number(), z.string().trim().min(1)]).pipe(z.coerce.number())
});
const userCollectionSchema = z.union([
  z.record(z.string(), userSchema).transform((users) => Object.entries(users).map(([name, user]) => ({ ...user, name: user.name ?? name }))),
  z.array(userSchema.extend({ name: z.string() }))
]);

// The PDF explicitly permits different user collection structures.
export const usersSchema = z.union([z.object({ users: userCollectionSchema }).transform((body) => body.users), userCollectionSchema]);

export const parseJsonResponse = async (response: Response, failureMessage: string): Promise<JsonParseResult> => {
  const json = await t(async () => await response.json());
  if (!json.ok) {
    return { ok: false, result: { status: 'fail', message: failureMessage, details: responseDetails(response) } };
  }
  return { ok: true, value: json.value };
};
