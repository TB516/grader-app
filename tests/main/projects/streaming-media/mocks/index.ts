import { setupServer } from 'msw/node';
import {
  badAcceptRangesMediaHandlers,
  badContentRangeMediaHandlers,
  badContentTypeMediaHandlers,
  badSignatureMediaHandlers,
  emptyMediaHandlers,
  goodMediaHandlers,
  http200MediaHandlers,
  httpErrorMediaHandlers,
  networkErrorMediaHandlers
} from './media-handlers';
import { badPageHandlers, emptyPageHandlers, goodPageHandlers, httpErrorPageHandlers, networkErrorPageHandlers } from './page-handlers';

export const server = setupServer(
  ...[
    ...goodPageHandlers,
    ...badPageHandlers,
    ...emptyPageHandlers,
    ...httpErrorPageHandlers,
    ...networkErrorPageHandlers,
    ...goodMediaHandlers,
    ...http200MediaHandlers,
    ...badContentTypeMediaHandlers,
    ...badAcceptRangesMediaHandlers,
    ...badContentRangeMediaHandlers,
    ...emptyMediaHandlers,
    ...badSignatureMediaHandlers,
    ...httpErrorMediaHandlers,
    ...networkErrorMediaHandlers
  ]
);
