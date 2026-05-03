import { ROUTE_SUBSITE_INDEX } from './constants';

export default {
  path: '/subsite',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SUBSITE_INDEX,
      component: () => import('@/pages/subsite/Index.vue')
    }
  ]
};
