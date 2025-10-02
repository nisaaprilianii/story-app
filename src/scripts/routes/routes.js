import HomePage from '../pages/home/home-page.js';
import AddPage from '../pages/add/add-story-page.js';
import RegisterPage from '../pages/login/register-page.js';
import LoginPage from '../pages/login/login-page.js';
import DetailPage from '../pages/detail/detail-page.js';
import aboutPage from '../pages/about/about-page.js';

const routes = {
  '/': HomePage,
  '/about': aboutPage,
  '/add': AddPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/detail/:id': DetailPage,
  '/logout': null, 
};

export default routes;
