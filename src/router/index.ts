import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import content from './content';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue')
  },
  content
];

const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes
});
export default router;
