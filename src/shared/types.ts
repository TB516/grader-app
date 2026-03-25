import { projects } from './projects';

export type ProjectTypes = (typeof projects)[number];

export type GraderRun = {
  label: string;
  result: GraderRunResult | null;
};

export type GraderRunResult = {
  status: 'pass' | 'fail' | 'error';
  message: string;
  details?: string;
};
