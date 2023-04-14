import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import NotFound from '../views/NotFound.vue';
import Login from '../components/Login.vue';

const routes = [
  {
    path: '/', component: HomeView,
  },
  {
    path: '/login', component: Login,
  },
  // 404 -> Always at the end!
  {
    path: '/:pathMatch(.*)*', component: NotFound,
  },
];

const history = createWebHistory();

const router = createRouter({ history, routes });

export default router;
