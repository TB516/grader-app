import { GraderRun, GraderRunResult } from '../shared/types';

export type StreamRunnerResultFunction = (run: GraderRun) => void;

export type StreamingDoneFunction = VoidFunction;

export type Grader = {
  label: string;
  run: (url: string) => Promise<GraderRunResult>;
};
