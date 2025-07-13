import { createRouter, createWebHistory } from 'vue-router';
import auth from './auth';
import console from './console';
import chat from './chat';
import grok from './grok';
import deepseek from './deepseek';
import chatgpt from './chatgpt';
import midjourney from './midjourney';
import distribution from './distribution';
import chatdoc from './chatdoc';
import qrart from './qrart';
import luma from './luma';
import pika from './pika';
import kling from './kling';
import flux from './flux';
import hailuo from './hailuo';
import headshots from './headshots';
import suno from './suno';
import site from './site';
import profile from './profile';

import { ROUTE_CHATGPT_CONVERSATION_NEW } from './constants';
import { DEFAULT_LOCALE, setI18nLanguage } from '@/i18n';
import { getCookie } from 'typescript-cookie';

const routes = [
  {
    path: '/',
    redirect: { name: ROUTE_CHATGPT_CONVERSATION_NEW }
  },
  console,
  chatdoc,
  auth,
  chat,
  chatgpt,
  grok,
  deepseek,
  qrart,
  luma,
  pika,
  kling,
  flux,
  hailuo,
  headshots,
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
