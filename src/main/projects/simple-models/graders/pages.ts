import { Effect } from 'effect';
import type { Grader } from '../../../types';
import { projectUrl } from '../../utils/project-url';
import { readPage } from './forms';

export const pagesGrader: Grader = {
  label: 'MVC Pages Return HTML',
  run: (url) =>
    Effect.gen(function* () {
      for (const path of ['/', '/page1', '/page2', '/page3', '/page4']) yield* readPage(projectUrl(url, path));
      return { status: 'pass', message: 'The home page and pages 1–4 returned HTML' };
    })
};
