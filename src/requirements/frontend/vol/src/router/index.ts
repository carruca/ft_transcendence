import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import NotFound from '../views/NotFound.vue';
import Login from '../components/Login.vue';
import Profile from '@/components/Profile/Profile.vue';//@ its from root
import About from '../views/AboutView.vue';
import Logout from '../components/Logout.vue';
import GameView from '../views/GameView.vue';
import Setup from '@/components/Setup/Setup.vue';
import Settings from '@/components/Settings.vue';
import _2FA from '@/components/2FA.vue';
import ChatView from '../views/ChatView.vue';
import AdminView from '../views/AdminView.vue';

const routes = [
  {
    path: '/',
    component: HomeView,
    children: [
      {
        path: 'about',
        name: 'About',
        component: About
      },
      {
        path: 'game',
        name: 'Game',
        component: GameView,
      },
      {
        path: 'chat',
        name: 'Chat',
        component: ChatView,
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
      },
      {
        path: 'admin',
        name: 'Admin',
        component: AdminView,
      }
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
    path: '/:pathMatch(.*)*', component: NotFound,
  },
];

const history = createWebHistory();

const router = createRouter({ history, routes });

export default router;
