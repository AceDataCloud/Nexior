import { createRouter, createWebHistory } from 'vue-router';
import auth from './auth';
import conversation from './conversation';
import store from '@/store';
import chat from './chat';
import paint from './paint';
import { ROUTE_AUTH_LOGIN, ROUTE_CONVERSATION_NEW, ROUTE_INDEX } from './constants';

const routes = [
  {
    path: '/',
    name: ROUTE_INDEX,
    redirect: {
      name: ROUTE_CONVERSATION_NEW
    }
  },
  chat,
  paint
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

export * from './constants';
