/** How one check went. `details` holds extra context, such as a summary of the response. */
export type CheckResult = {
  status: 'passed' | 'failed' | 'error';
  message: string;
  details?: string | undefined;
};

/** A run first lists its checks, then reports each one as it finishes, in any order. */
export type GradingEvent =
  | { type: 'started'; checks: string[] }
  | { type: 'result'; index: number; result: CheckResult };
