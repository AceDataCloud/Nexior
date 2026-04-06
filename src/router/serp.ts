import { ROUTE_SERP_INDEX } from './constants';

export default {
  path: '/serp',
  meta: {
    auth: true,
    appName: 'serp'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SERP_INDEX,
      component: () => import('@/pages/serp/Index.vue')
    }
  ]
};
