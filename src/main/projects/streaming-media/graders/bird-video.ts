import { mediaRangeGrader, mp4SignatureCheck } from './media-range';

export const birdVideoGrader = mediaRangeGrader({
  label: 'Bird MP4 Supports Range Streaming',
  path: '/bird.mp4',
  expectedContentType: 'video/mp4',
  passMessage: 'Bird MP4 supports range streaming',
  signatureFailureMessage: 'Bird MP4 body was not an MP4 file',
  signatureCheck: mp4SignatureCheck
});
