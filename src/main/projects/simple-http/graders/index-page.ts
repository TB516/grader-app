import { htmlPageGrader } from '../../utils/html-page';

export const indexPageGrader = htmlPageGrader({
  label: 'Index Page Returns HTML',
  path: '/',
  passMessage: 'Index Page returned HTML'
});
