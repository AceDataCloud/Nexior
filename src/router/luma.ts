import { ROUTE_LUMA_INDEX } from './constants';

export default {
  path: '/luma',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_LUMA_INDEX,
      component: () => import('@/pages/luma/Index.vue')
    }
  ]
};
