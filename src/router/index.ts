import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import content from './content';
import auth from './auth';

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
export default router;
