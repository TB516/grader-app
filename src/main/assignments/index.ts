import type { AssignmentName } from '../../shared/assignments';
import type { Check } from '../grading/check';
import { httpApi1 } from './http-api-1';
import { simpleHttp } from './simple-http';

export const checksByAssignment: Record<AssignmentName, Check[]> = {
  'Simple HTTP': simpleHttp,
  'HTTP API I': httpApi1
};
