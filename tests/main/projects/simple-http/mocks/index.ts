import { setupServer } from 'msw/node';
import { indexPageHandler } from './index-page-handler';

export const server = setupServer(...[indexPageHandler]);
