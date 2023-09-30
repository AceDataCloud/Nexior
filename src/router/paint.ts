import { ROUTE_PAINT_INDEX } from './constants';

export default {
  path: '/paint',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_PAINT_INDEX,
      component: () => import('@/pages/paint/Index.vue')
    }
  ]
};
