import { ROUTE_FLUX_INDEX } from './constants';

export default {
  path: '/flux',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_FLUX_INDEX,
      component: () => import('@/pages/flux/Index.vue')
    }
  ]
};
