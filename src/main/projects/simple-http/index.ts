import type { GraderRun } from '../../../shared/types';
import type { Grader, StreamRunnerResultFunction, StreamingDoneFunction } from '../../types';
import { dankmemesImageGrader } from './graders/dankmemes-image';
import { fallbackRouteGrader } from './graders/fallback-route';
import { helloJsonGrader } from './graders/hello-json';
import { helloTextGrader } from './graders/hello-text';
import { indexPageGrader } from './graders/index-page';
import { page2Grader } from './graders/page-2';
import { timeJsonGrader } from './graders/time-json';
import { timeTextGrader } from './graders/time-text';

const graders: Grader[] = [
  indexPageGrader,
  page2Grader,
  helloTextGrader,
  timeTextGrader,
  helloJsonGrader,
  timeJsonGrader,
  dankmemesImageGrader,
  fallbackRouteGrader
];

export const simpleHttpRunner = (url: string, send: StreamRunnerResultFunction, done: StreamingDoneFunction): GraderRun[] => {
  const runs: GraderRun[] = graders.map((grader) => ({ label: grader.label, result: null }));

  Promise.all(
    graders.map(async (grader) => {
      const result = await grader.run(url);
      send({ label: grader.label, result });
    })
  ).finally(() => {
    done();
  });

  return runs;
};
