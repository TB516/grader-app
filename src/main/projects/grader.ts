import type { GraderResult } from '../../shared/types';

export type Grader = {
  label: string;
  run: (url: string) => Promise<GraderResult>;
};
