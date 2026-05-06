import type { GraderRun } from '../../../shared/types';
import type { Grader, StreamingDoneFunction, StreamRunnerResultFunction } from '../../types';
import { homePageGrader } from './graders/home-page';
import { jsonDefaultGrader } from './graders/json-default';
import { jsonEndpointsGrader } from './graders/json-endpoints';
import { styleCssGrader } from './graders/style-css';
import { xmlEndpointsGrader } from './graders/xml-endpoints';

const graders: Grader[] = [homePageGrader, styleCssGrader, jsonDefaultGrader, jsonEndpointsGrader, xmlEndpointsGrader];

export const httpApi1Runner = (url: URL, send: StreamRunnerResultFunction, done: StreamingDoneFunction): GraderRun[] => {
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
