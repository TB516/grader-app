import { projects } from './projects';

export type ProjectTypes = (typeof projects)[number];

export type GraderRun = {
  label: string;
  result: GraderResult | null;
};

export type GraderResult = {
  status: 'pass' | 'fail' | 'error';
  message: string;
  details?: string;
};
