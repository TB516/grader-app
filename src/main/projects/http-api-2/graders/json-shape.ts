import { Effect, Schema } from 'effect';
import type { GraderResult } from '../../../../shared/types';

export const messageSchema = Schema.Struct({ message: Schema.Trim.check(Schema.isNonEmpty()) });
export const errorSchema = Schema.Struct({ ...messageSchema.fields, id: Schema.Trim.check(Schema.isNonEmpty()) });

const userSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  age: Schema.Union([Schema.Finite, Schema.Trim.check(Schema.isNonEmpty()).pipe(Schema.decodeTo(Schema.FiniteFromString))])
});
const userCollectionSchema = Schema.Union([
  Schema.Record(Schema.String, userSchema),
  Schema.Array(Schema.Struct({ ...userSchema.fields, name: Schema.String }))
]);

/** The PDF permits keyed records or arrays, with or without a users wrapper. */
export const parseUsers = (input: unknown, message: string) =>
  Schema.decodeUnknownEffect(Schema.Struct({ users: userCollectionSchema }))(input).pipe(
    Effect.map((body) => body.users),
    Effect.catch(() => Schema.decodeUnknownEffect(userCollectionSchema)(input)),
    Effect.map((users) => Object.entries(users).map(([name, user]) => ({ ...user, name: user.name ?? name }))),
    Effect.mapError((): GraderResult => ({ status: 'fail', message, details: JSON.stringify(input) }))
  );
