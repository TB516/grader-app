import { t } from 'try';
import type { GraderRun } from '../../../shared/types';
import type { Grader, StreamingDoneFunction, StreamRunnerResultFunction } from '../../types';
import { errorDetails } from '../utils/details';
import { homePageGrader } from './graders/home-page';
import { jsonDefaultGrader } from './graders/json-default';
import { jsonEndpointsGrader } from './graders/json-endpoints';
import { styleCssGrader } from './graders/style-css';
import { xmlEndpointsGrader } from './graders/xml-endpoints';

const graders: Grader[] = [homePageGrader, styleCssGrader, jsonDefaultGrader, jsonEndpointsGrader, xmlEndpointsGrader];

export const httpApi1Runner = (url: URL, send: StreamRunnerResultFunction, done: StreamingDoneFunction): GraderRun[] => {
  const runs: GraderRun[] = graders.map((grader) => ({ label: grader.label, result: null }));

  void Promise.all(
    graders.map(async (grader) => {
      const outcome = await t(() => grader.run(url));
      if (!outcome.ok) {
        send({
          label: grader.label,
          result: {
            status: 'error',
            message: 'The grader could not complete',
            details: errorDetails(outcome.error)
          }
        });
        return;
      }
      send({ label: grader.label, result: outcome.value });
    })
  ).then(() => {
    done();
  });

  return runs;
};
