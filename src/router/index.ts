import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import auth from './auth';
import course from './course';
import episode from './episode';
import store from '@/store';

const routes = [
  {
    path: '/',
    name: 'index',
    redirect: '/courses'
  },
  auth,
  course,
  episode
];

const router = createRouter({
  history: createWebHistory(),
  // history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.auth)) {
    if (!store.getters.authenticated) {
      next({
        name: 'auth-login',
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
