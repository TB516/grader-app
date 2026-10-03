import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { readDogForms } from './forms';

export const dogFormsGrader: Grader = {
  label: 'Page 3 Has Dog Creation And Lookup Forms',
  run: (url) =>
    Effect.gen(function* () {
      yield* readDogForms(url);
      return { status: 'pass', message: 'Dog creation and lookup forms have the required text and number inputs' };
    })
};
