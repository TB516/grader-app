import { htmlPageGrader } from './html-page';

export const indexPageGrader = htmlPageGrader({
  label: 'Index Page Returns HTML',
  path: '/',
  passMessage: 'Index Page Returned HTML'
});
