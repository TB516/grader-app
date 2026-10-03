import { projects } from './projects';

export type ProjectTypes = (typeof projects)[number];

export type GraderRun = {
  id: string;
  label: string;
  result: GraderResult | null;
};

export type GraderResult = {
  status: 'pass' | 'fail' | 'error' | 'cancelled';
  message: string;
  details?: string;
};

export type GradingRequest = {
  runId: string;
  assignment: string;
  url: string;
};

/** A single channel preserves start, result, and completion ordering. */
export type GradingEvent = { runId: string } & (
  | { type: 'started'; checks: GraderRun[] }
  | { type: 'result'; check: GraderRun }
  | { type: 'finished'; outcome: 'completed' | 'cancelled' | 'error'; message?: string }
);
