import type { Grader } from '../../types';
import { accountSessionGrader } from './graders/account-session';
import { domosGrader } from './graders/domos';
import { publicAccessGrader } from './graders/public-access';

export const domomakerCGraders = {
  'public-access': publicAccessGrader,
  'account-session': accountSessionGrader,
  domos: domosGrader
} satisfies Record<string, Grader>;
