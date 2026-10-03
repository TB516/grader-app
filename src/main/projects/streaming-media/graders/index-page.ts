import { htmlPageGrader } from '../../utils/html-page';

export const indexPageGrader = htmlPageGrader({
  label: 'Index Page Returns HTML',
  path: '/',
  resource: { selector: 'video[src], video source[src]', attribute: 'src', path: '/party.mp4' },
  passMessage: 'Index Page Returned HTML'
});
