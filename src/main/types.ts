import type { Effect, Scope } from 'effect';
import type { GraderResult } from '../shared/types';

export type Grader = {
  label: string;
  /** The runner scopes requests and converts expected failures into reported results. */
  run: (url: URL) => Effect.Effect<GraderResult, GraderResult, Scope.Scope>;
};
