import { ROUTE_SITE_INDEX } from './constants';

export default {
  path: '/site',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SITE_INDEX,
      component: () => import('@/pages/site/Index.vue')
    }
  ]
};
