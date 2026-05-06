import { mediaRangeGrader, mp4SignatureCheck } from './media-range';

export const partyVideoGrader = mediaRangeGrader({
  label: 'Party MP4 Supports Range Streaming',
  path: '/party.mp4',
  expectedContentType: 'video/mp4',
  passMessage: 'Party MP4 supports range streaming',
  signatureFailureMessage: 'Party MP4 body was not an MP4 file',
  signatureCheck: mp4SignatureCheck
});
