import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue')
  },
  {
    path: '/editor',
    name: 'editor',
    component: () => import('@/pages/Editor.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
export default router;
