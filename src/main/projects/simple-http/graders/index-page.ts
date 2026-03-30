import type { Grader } from '../../../types';
import { genericHtmlRunner } from './generic-html-runner';

export const indexPageGrader: Grader = {
  label: 'Index Page Returns HTML',
  run: genericHtmlRunner
};
