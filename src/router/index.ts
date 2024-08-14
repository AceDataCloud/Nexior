import { createRouter, createWebHistory } from 'vue-router';
import auth from './auth';
import console from './console';
import chat from './chat';
import midjourney from './midjourney';
import distribution from './distribution';
import chatdoc from './chatdoc';
import qrart from './qrart';
import luma from './luma';
import suno from './suno';
import site from './site';
import profile from './profile';

import { ROUTE_CHAT_CONVERSATION_NEW, ROUTE_INDEX } from './constants';
import { DEFAULT_LOCALE, setI18nLanguage } from '@/i18n';
import { getCookie } from 'typescript-cookie';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/Index.vue'),
    children: [
      {
        path: '',
        name: ROUTE_INDEX,
        component: () => import('@/pages/index/Index.vue')
      }
    ]
  },
  console,
  chatdoc,
  auth,
  chat,
  qrart,
  luma,
  suno,
  midjourney,
  distribution,
  site,
  profile
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const locale = getCookie('LOCALE') || DEFAULT_LOCALE;
  await setI18nLanguage(locale);
  return next();
});

export default router;

export * from './constants';
