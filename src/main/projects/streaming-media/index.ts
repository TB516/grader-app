import type { Grader } from '../../types';
import { birdVideoGrader } from './graders/bird-video';
import { blingAudioGrader } from './graders/bling-audio';
import { indexPageGrader } from './graders/index-page';
import { page2Grader } from './graders/page-2';
import { page3Grader } from './graders/page-3';
import { partyVideoGrader } from './graders/party-video';

/** Check IDs are independent of the labels shown in results. */
export const streamingMediaGraders = {
  'index-page': indexPageGrader,
  'page-2': page2Grader,
  'page-3': page3Grader,
  'party-video': partyVideoGrader,
  'bling-audio': blingAudioGrader,
  'bird-video': birdVideoGrader
} satisfies Record<string, Grader>;
