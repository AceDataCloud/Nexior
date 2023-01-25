import { createRouter, createWebHistory } from 'vue-router';
import service from './service';
import auth from './auth';
import console from './console';
import document from './document';
import store from '@/store';
import { ROUTE_AUTH_LOGIN, ROUTE_INDEX, ROUTE_SERVICE_LIST } from './constants';

const routes = [
  {
    path: '/',
    name: ROUTE_INDEX,
    redirect: {
      name: ROUTE_SERVICE_LIST
    }
  },
  service,
  auth,
  console,
  document
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
