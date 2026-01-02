import { ROUTE_SEEDREAM_INDEX } from './constants';

export default {
  path: '/seedream',
  meta: {
    auth: true,
    appName: 'seedream'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SEEDREAM_INDEX,
      component: () => import('@/pages/seedream/Index.vue')
    }
  ]
};
