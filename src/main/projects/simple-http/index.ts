import type { GraderRun } from '../../../shared/types';
import type { Grader, StreamRunnerResultFunction, StreamingDoneFunction } from '../grader';
import { indexPageGrader } from './graders/index-page';

const graders: Grader[] = [indexPageGrader];

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
