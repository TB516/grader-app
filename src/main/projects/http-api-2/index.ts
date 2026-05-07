import type { GraderRun } from '../../../shared/types';
import type { Grader, StreamingDoneFunction, StreamRunnerResultFunction } from '../../types';
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
