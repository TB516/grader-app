import { setupServer } from 'msw/node';
import indexHandler from './index.handler';

export const server = setupServer(...[indexHandler]);
