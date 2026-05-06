import type { GraderRun } from '../../../shared/types';
import type { Grader, StreamingDoneFunction, StreamRunnerResultFunction } from '../../types';
import { birdVideoGrader } from './graders/bird-video';
import { blingAudioGrader } from './graders/bling-audio';
import { indexPageGrader } from './graders/index-page';
import { page2Grader } from './graders/page-2';
import { page3Grader } from './graders/page-3';
import { partyVideoGrader } from './graders/party-video';

const graders: Grader[] = [indexPageGrader, page2Grader, page3Grader, partyVideoGrader, blingAudioGrader, birdVideoGrader];

export const streamingMediaRunner = (url: URL, send: StreamRunnerResultFunction, done: StreamingDoneFunction): GraderRun[] => {
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
