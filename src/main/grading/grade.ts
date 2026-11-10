import { Effect, flow, Predicate, Schedule, Stream } from 'effect';
import { FetchHttpClient, HttpClient, HttpClientRequest, type HttpClientError } from 'effect/http';

import type { CheckResult, GradingEvent } from '../../shared/grading';
import type { Check } from './check';

/** Runs a few checks at once so a slow site doesn't make grading drag, without flooding it. */
const concurrency = 4;

/** Covers the whole check, including reading response bodies. */
const checkTimeout = '15 seconds';

/** Node's fetch keeps the network error code (ECONNREFUSED, ENOTFOUND, ...) one level down. */
const networkErrorCode = (error: HttpClientError.HttpClientError) => {
  const cause = Predicate.hasProperty(error.cause, 'cause') ? error.cause.cause : undefined;
  if (Predicate.hasProperty(cause, 'code') && Predicate.isString(cause.code)) return cause.code;
  return undefined;
};

const runCheck = (
  check: Check,
  url: string
): Effect.Effect<CheckResult, never, HttpClient.HttpClient> =>
  check.run.pipe(
    Effect.updateService(
      HttpClient.HttpClient,
      flow(
        HttpClient.mapRequest(HttpClientRequest.prependUrl(url)),
        // Only retry when no response arrived. A 500 is the submission's bug, not a blip.
        HttpClient.retryTransient({
          retryOn: 'errors-only',
          times: 2,
          schedule: Schedule.exponential('500 millis')
        })
      )
    ),
    Effect.timeout(checkTimeout),
    Effect.map((summary): CheckResult => ({ status: 'passed', message: summary })),
    Effect.catchTags({
      CheckFailed: (error) =>
        Effect.succeed<CheckResult>({
          status: 'failed',
          message: error.message,
          details: error.details
        }),
      HttpClientError: (error) =>
        Effect.succeed<CheckResult>({
          status: 'error',
          message: error.message,
          details: networkErrorCode(error)
        }),
      TimeoutError: () =>
        Effect.succeed<CheckResult>({ status: 'error', message: `Timed out after ${checkTimeout}` })
    }),
    Effect.catchDefect((defect) =>
      Effect.succeed<CheckResult>({
        status: 'error',
        message: `The check crashed: ${String(defect)}`
      })
    )
  );

/**
 * Grades a deployed site. Stopping the stream interrupts the checks still running and aborts
 * their requests.
 */
export const grade = (checks: ReadonlyArray<Check>, url: string): Stream.Stream<GradingEvent> => {
  const started: GradingEvent = { type: 'started', checks: checks.map((check) => check.label) };

  const results = Stream.fromIterable(checks).pipe(
    Stream.mapEffect(
      (check, index) =>
        Effect.map(runCheck(check, url), (result): GradingEvent => ({
          type: 'result',
          index,
          result
        })),
      { concurrency, unordered: true }
    )
  );

  return Stream.concat(Stream.make(started), results).pipe(Stream.provide(FetchHttpClient.layer));
};
