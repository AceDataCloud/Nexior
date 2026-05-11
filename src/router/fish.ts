import { ROUTE_FISH_TTS_INDEX, ROUTE_FISH_MODEL_INDEX } from './constants';

export default {
  path: '/fish',
  meta: {
    auth: true,
    appName: 'fish'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: { name: ROUTE_FISH_TTS_INDEX }
    },
    {
      path: 'tts',
      name: ROUTE_FISH_TTS_INDEX,
      component: () => import('@/pages/fish/Tts.vue')
    },
    {
      path: 'model',
      name: ROUTE_FISH_MODEL_INDEX,
      component: () => import('@/pages/fish/Model.vue')
    }
  ]
};
