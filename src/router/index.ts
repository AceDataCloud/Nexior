import { createRouter, createWebHistory } from 'vue-router';
import auth from './auth';
import chat from './chat';
import midjourney from './midjourney';
import { ROUTE_CONVERSATION_NEW, ROUTE_INDEX } from './constants';

const routes = [
  {
    path: '/',
    name: ROUTE_INDEX,
    redirect: {
      name: ROUTE_CONVERSATION_NEW
    }
  },
  auth,
  chat,
  midjourney
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

export * from './constants';
