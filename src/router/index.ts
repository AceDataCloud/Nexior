import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import content from './content';
import editor from './editor';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue')
  },
  content,
  editor
];

const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes
});
export default router;
