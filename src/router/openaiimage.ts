import { ROUTE_OPENAIIMAGE_INDEX } from './constants';

export default {
  path: '/openai-image',
  meta: {
    auth: true,
    appName: 'openaiimage'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_OPENAIIMAGE_INDEX,
      component: () => import('@/pages/openaiimage/Index.vue')
    }
  ]
};
