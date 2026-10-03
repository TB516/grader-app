import type { Grader } from '../../types';
import { dogFormsGrader } from './graders/dog-forms';
import { dogLifecycleGrader } from './graders/dog-lifecycle';
import { pagesGrader } from './graders/pages';

export const simpleModelsGraders = {
  pages: pagesGrader,
  'dog-forms': dogFormsGrader,
  'dog-lifecycle': dogLifecycleGrader
} satisfies Record<string, Grader>;
