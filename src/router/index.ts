import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import i18n from '../i18n';

const t = i18n.global.t;

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue')
  },
  {
    path: '/content',
    name: 'content',
    meta: {
      title: t('common.nav.content')
    },
    component: () => import('@/layouts/Content.vue'),
    children: [
      {
        path: 'editor',
        name: 'editor',
        meta: {
          title: t('common.nav.editor')
        },
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
