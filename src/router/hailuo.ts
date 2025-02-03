import { ROUTE_HAILUO_INDEX } from './constants';

export default {
  path: '/hailuo',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_HAILUO_INDEX,
      component: () => import('@/pages/hailuo/Index.vue')
    }
  ]
};
