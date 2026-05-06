import { mediaRangeGrader, mp3SignatureCheck } from './media-range';

export const blingAudioGrader = mediaRangeGrader({
  label: 'Bling MP3 Supports Range Streaming',
  path: '/bling.mp3',
  expectedContentType: 'audio/mpeg',
  passMessage: 'Bling MP3 supports range streaming',
  signatureFailureMessage: 'Bling MP3 body was not an MP3 file',
  signatureCheck: mp3SignatureCheck
});
