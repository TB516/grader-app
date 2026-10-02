import { t } from 'try';
import type { GraderRun } from '../../../shared/types';
import type { Grader, StreamingDoneFunction, StreamRunnerResultFunction } from '../../types';
import { errorDetails } from '../utils/details';
import { addUserGrader } from './graders/add-user';
import { getUsersGetGrader } from './graders/get-users-get';
import { getUsersHeadGrader } from './graders/get-users-head';
import { indexPageGrader } from './graders/index-page';
import { notRealGetGrader } from './graders/not-real-get';
import { notRealHeadGrader } from './graders/not-real-head';
import { styleCssGrader } from './graders/style-css';
import { unknownRouteGrader } from './graders/unknown-route';

const graders: Grader[] = [
  indexPageGrader,
  styleCssGrader,
  getUsersGetGrader,
  getUsersHeadGrader,
  notRealGetGrader,
  notRealHeadGrader,
  unknownRouteGrader,
  addUserGrader
];

export const httpApi2Runner = (url: URL, send: StreamRunnerResultFunction, done: StreamingDoneFunction): GraderRun[] => {
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
