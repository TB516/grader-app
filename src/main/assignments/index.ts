import type { AssignmentName } from '../../shared/assignments';
import type { Check } from '../grading/check';
import { simpleHttp } from './simple-http';

export const checksByAssignment: Record<AssignmentName, Check[]> = {
  'Simple HTTP': simpleHttp
};
