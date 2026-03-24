import { setupServer } from 'msw/node';
import indexHandler from './index-page-handler';

export const server = setupServer(...[indexHandler]);
