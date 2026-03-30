import type { Grader } from '../../../types';
import { genericTextRunner } from './generic-text-runner';

export const helloTextGrader: Grader = {
  label: 'Hello Endpoint Returns "Hello World"',
  run: (url) => genericTextRunner(url, 'Hello World')
};
