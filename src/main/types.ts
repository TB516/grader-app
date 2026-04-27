import type { GraderResult, GraderRun } from '../shared/types';

export type StreamRunnerResultFunction = (run: GraderRun) => void;

export type StreamingDoneFunction = VoidFunction;

export type Grader = {
  label: string;
  run: (url: URL) => Promise<GraderResult>;
};
