import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import Leaderboard from '@/components/Leaderboard/Leaderboard.vue'
import NotFound from '../views/NotFound.vue';
import Login from '../components/Login.vue';
import Profile from '@/components/Profile/Profile.vue';//@ its from root
import About from '../views/AboutView.vue';
import Logout from '../components/Logout.vue';
import GameView from '../views/GameView.vue';
import Setup from '@/components/Setup/Setup.vue'
import Settings from '@/components/Settings.vue'
import _2FA from '@/components/2FA.vue'

const routes = [
  {
    path: '/',
    component: HomeView,
    children: [
      {
      path: '',
      name: 'Leaderboard',
      component: Leaderboard,
      },
      {
        path: 'about',
        name: 'About',
        component: About,
      },
      {
        path: 'game',
        name: 'Game',
        component: GameView,
      },
      {
        path: 'chat',
        name: 'Chat',
        component: undefined,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
      },
      {
        path: 'admin',
        name: 'Admin',
        component: undefined,
      },
      {
        path: '/:username',
        name: 'Profile',
        component: Profile,
      },
      // TODO: Add routes that must display the navbar and sidebar here
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout,
  },
  {
    path: '/setup',
    name: 'Setup',
    component: Setup,
  },
  {
    path: '/2fa',
    name: '2FA',
    component: _2FA,
  },
  // 404 -> Always at the end!
  {
    path: '/:pathMatch(.*)*',
    component: NotFound,
    alias: '/404',
  },
];

const history = createWebHistory();

const router = createRouter({ history, routes });

export default router;
