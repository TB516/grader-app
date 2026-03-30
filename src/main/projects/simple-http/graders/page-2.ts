import type { Grader } from '../../../types';
import { genericHtmlRunner } from './generic-html-runner';

export const page2Grader: Grader = {
  label: 'Page 2 Returns HTML',
  run: genericHtmlRunner
};
