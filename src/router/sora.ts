import { ROUTE_SORA_INDEX } from './constants';

export default {
  path: '/sora',
  meta: {
    auth: true,
    appName: 'sora'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SORA_INDEX,
      component: () => import('@/pages/sora/Index.vue')
    }
  ]
};
