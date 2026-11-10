import { Schema } from 'effect';
import type { Effect } from 'effect';
import type { HttpClient, HttpClientError } from 'effect/http';

/** The site responded, but not the way the assignment asks. Shown as a fail. */
export class CheckFailed extends Schema.TaggedError<CheckFailed>()('CheckFailed', {
  message: Schema.String,
  details: Schema.optional(Schema.String)
}) {}

/**
 * One rubric item. `run` succeeds with a short summary of what passed. Its HttpClient is already
 * pointed at the submission's URL, so checks request paths like '/hello'.
 */
export type Check = {
  readonly label: string;
  readonly run: Effect.Effect<
    string,
    CheckFailed | HttpClientError.HttpClientError,
    HttpClient.HttpClient
  >;
};
