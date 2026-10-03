import type { Grader } from '../../types';
import { addUserGrader } from './graders/add-user';
import { getUsersGetGrader } from './graders/get-users-get';
import { getUsersHeadGrader } from './graders/get-users-head';
import { indexPageGrader } from './graders/index-page';
import { notRealGetGrader } from './graders/not-real-get';
import { notRealHeadGrader } from './graders/not-real-head';
import { styleCssGrader } from './graders/style-css';
import { unknownRouteGrader } from './graders/unknown-route';

/** Check IDs are independent of the labels shown in results. */
export const httpApi2Graders = {
  'index-page': indexPageGrader,
  'style-css': styleCssGrader,
  'get-users-get': getUsersGetGrader,
  'get-users-head': getUsersHeadGrader,
  'not-real-get': notRealGetGrader,
  'not-real-head': notRealHeadGrader,
  'unknown-route': unknownRouteGrader,
  'add-user': addUserGrader
} satisfies Record<string, Grader>;
