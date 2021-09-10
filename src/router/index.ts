import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import content from './content';
import auth from './auth';
import store from '@/store';

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: {
      name: 'article-index'
    }
  },
  content,
  auth
];

const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.auth)) {
    if (!store.getters.authenticated) {
      next({
        name: 'login',
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
