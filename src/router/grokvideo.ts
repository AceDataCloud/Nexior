import { ROUTE_GROKVIDEO_INDEX } from './constants';

export default {
  path: '/grok-video',
  meta: {
    auth: true,
    appName: 'grokvideo'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_GROKVIDEO_INDEX,
      component: () => import('@/pages/grokvideo/Index.vue')
    }
  ]
};
