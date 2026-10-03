import { htmlPageGrader } from '../../utils/html-page';

export const page2Grader = htmlPageGrader({
  label: 'Page 2 Returns HTML',
  path: '/page2',
  resource: { selector: 'audio[src], audio source[src]', attribute: 'src', path: '/bling.mp3' },
  passMessage: 'Page 2 Returned HTML'
});
