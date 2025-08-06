import { createRouter, createWebHistory } from 'vue-router';
import auth from './auth';
import console from './console';
import grok from './grok';
import deepseek from './deepseek';
import chatgpt from './chatgpt';
import midjourney from './midjourney';
import distribution from './distribution';
import qrart from './qrart';
import luma from './luma';
import pika from './pika';
import kling from './kling';
import veo from './veo';
import pixverse from './pixverse';
import flux from './flux';
import hailuo from './hailuo';
import headshots from './headshots';
import suno from './suno';
import site from './site';
import profile from './profile';

import { ROUTE_CHATGPT_CONVERSATION_NEW } from './constants';
import { getCookie } from 'typescript-cookie';
import { I18N_DEFAULT_LOCALE } from '@/constants/i18n';
import { getLocale, setI18nLanguage } from '@/i18n';

const routes = [
  {
    path: '/',
    redirect: { name: ROUTE_CHATGPT_CONVERSATION_NEW }
  },
  console,
  auth,
  chatgpt,
  grok,
  deepseek,
  qrart,
  luma,
  pika,
  kling,
  veo,
  pixverse,
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

router.beforeEach(async (_to, _from, next) => {
  const locale = getLocale(getCookie('LOCALE') || I18N_DEFAULT_LOCALE);
  await setI18nLanguage(locale);
  return next();
});

export default router;

export * from './constants';
