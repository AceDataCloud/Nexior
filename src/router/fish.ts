import { ROUTE_FISH_TTS_INDEX } from './constants';

export default {
  path: '/fish',
  meta: {
    auth: true,
    appName: 'fish'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      // Default to TTS — voice cloning page lands in PR #2.
      path: '',
      redirect: { name: ROUTE_FISH_TTS_INDEX }
    },
    {
      path: 'tts',
      name: ROUTE_FISH_TTS_INDEX,
      component: () => import('@/pages/fish/Tts.vue')
    }
  ]
};
