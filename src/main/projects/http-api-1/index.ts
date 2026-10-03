import type { Grader } from '../../types';
import { homePageGrader } from './graders/home-page';
import { jsonDefaultGrader } from './graders/json-default';
import { jsonEndpointsGrader } from './graders/json-endpoints';
import { styleCssGrader } from './graders/style-css';
import { xmlEndpointsGrader } from './graders/xml-endpoints';

/** Check IDs are independent of the labels shown in results. */
export const httpApi1Graders = {
  'home-page': homePageGrader,
  'style-css': styleCssGrader,
  'json-default': jsonDefaultGrader,
  'json-endpoints': jsonEndpointsGrader,
  'xml-endpoints': xmlEndpointsGrader
} satisfies Record<string, Grader>;
