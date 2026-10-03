import { htmlPageGrader } from '../../utils/html-page';

export const page3Grader = htmlPageGrader({
  label: 'Page 3 Returns HTML',
  path: '/page3',
  resource: { selector: 'video[src], video source[src]', attribute: 'src', path: '/bird.mp4' },
  passMessage: 'Page 3 Returned HTML'
});
