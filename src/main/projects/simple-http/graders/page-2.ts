import type { Grader } from '../../grader';
import { genericHtmlRunner } from './generic-html-runner';

export const page2Grader: Grader = {
  label: 'Page 2 returns HTML',
  run: genericHtmlRunner
};
