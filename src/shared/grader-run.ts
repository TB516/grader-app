export interface GraderRun {
  label: string;
  result: GraderRunResult | null;
}

export interface GraderRunResult {
  status: 'pass' | 'fail' | 'error';
  message: string;
  details?: string;
}
