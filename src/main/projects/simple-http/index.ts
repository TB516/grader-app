import type { Grader } from '../../types';
import { fallbackRouteGrader } from '../utils/fallback-route';
import { dankmemesImageGrader } from './graders/dankmemes-image';
import { helloJsonGrader } from './graders/hello-json';
import { helloTextGrader } from './graders/hello-text';
import { indexPageGrader } from './graders/index-page';
import { page2Grader } from './graders/page-2';
import { timeJsonGrader } from './graders/time-json';
import { timeTextGrader } from './graders/time-text';

/** Check IDs are independent of the labels shown in results. */
export const simpleHttpGraders = {
  'index-page': indexPageGrader,
  'page-2': page2Grader,
  'hello-text': helloTextGrader,
  'time-text': timeTextGrader,
  'hello-json': helloJsonGrader,
  'time-json': timeJsonGrader,
  'dankmemes-image': dankmemesImageGrader,
  'fallback-route': fallbackRouteGrader
} satisfies Record<string, Grader>;
