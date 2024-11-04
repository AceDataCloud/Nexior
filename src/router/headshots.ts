import { ROUTE_HEADSHOTS_INDEX } from './constants';

export default {
  path: '/headshots',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_HEADSHOTS_INDEX,
      component: () => import('@/pages/headshots/Index.vue')
    }
  ]
};
