import { Effect, Exit } from 'effect';
import type { GraderResult, GraderRun, GradingEvent } from '../shared/types';
import { errorDetails } from './projects/utils/details';
import type { Grader } from './types';

/** Run one check with scoped request cleanup, a deadline, and isolated failures. */
export const runGrader = (url: URL, grader: Grader): Effect.Effect<GraderResult> =>
  Effect.scoped(Effect.suspend(() => grader.run(url))).pipe(
    Effect.catch((result) => Effect.succeed(result)),
    Effect.timeout('60 seconds'),
    Effect.catchDefect((error) => Effect.fail(error)),
    Effect.catch((error) => Effect.succeed<GraderResult>({ status: 'error', message: 'The grader could not complete', details: errorDetails(error) }))
  );

/** One effect owns all checks. Interrupting it aborts active requests and stops queued checks. */
export const gradingRun = (runId: string, url: URL, graders: Record<string, Grader>, emit: (event: GradingEvent) => void): Effect.Effect<void> =>
  Effect.suspend(() => {
    const checks: GraderRun[] = Object.entries(graders).map(([id, grader]) => ({ id, label: grader.label, result: null }));
    const report = (check: GraderRun, result: GraderResult): void => {
      check.result = result;
      emit({ runId, type: 'result', check: { ...check } });
    };

    return Effect.gen(function* () {
      yield* Effect.sync(() => emit({ runId, type: 'started', checks: checks.map((check) => ({ ...check })) }));
      yield* Effect.forEach(
        checks,
        (check) => runGrader(url, graders[check.id]).pipe(Effect.tap((result) => Effect.sync(() => report(check, result)))),
        { concurrency: 4, discard: true }
      );
    }).pipe(
      Effect.onExit((exit) =>
        Effect.sync(() => {
          if (Exit.isSuccess(exit)) {
            emit({ runId, type: 'finished', outcome: 'completed' });
            return;
          }
          const cancelled = Exit.hasInterrupts(exit);
          const message = cancelled ? 'Grading cancelled.' : 'Unable to finish grading.';
          for (const check of checks) {
            if (!check.result) report(check, { status: cancelled ? 'cancelled' : 'error', message });
          }
          emit({ runId, type: 'finished', outcome: cancelled ? 'cancelled' : 'error', message });
        })
      )
    );
  });
