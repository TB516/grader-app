import { htmlPageGrader } from '../../utils/html-page';

export const homePageGrader = htmlPageGrader({
  label: 'Home Page Returns HTML',
  path: '/',
  passMessage: 'Home Page returned HTML',
  resource: { selector: 'link[rel~=stylesheet][href]', attribute: 'href', path: '/style.css' }
});
