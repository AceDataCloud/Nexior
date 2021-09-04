import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import content from './content';

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: {
      name: 'article-index'
    }
  },
  content
];

const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes
});
export default router;
