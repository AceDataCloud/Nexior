import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue')
  },
  {
    path: '/content',
    name: 'content',
    component: () => import('@/layouts/Content.vue'),
    children: [
      {
        path: 'editor',
        name: 'editor',
        component: () => import('@/pages/content/Editor.vue')
      }
    ]
  }
];

const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes
});
export default router;
