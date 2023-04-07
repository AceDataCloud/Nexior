import { createRouter, createWebHistory } from 'vue-router';
import auth from './auth';
import conversation from './conversation';
import store from '@/store';
import { ROUTE_AUTH_LOGIN, ROUTE_CONVERSATION_NEW, ROUTE_INDEX } from './constants';

const routes = [
  {
    path: '/',
    name: ROUTE_INDEX,
    redirect: {
      name: ROUTE_CONVERSATION_NEW
    }
  },
  auth,
  conversation
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.auth)) {
    if (!store.getters.authenticated) {
      next({
        name: ROUTE_AUTH_LOGIN,
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;

export * from './constants';
