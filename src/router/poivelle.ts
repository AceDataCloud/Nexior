import { ROUTE_POIVELLE_INDEX } from './constants';

export default {
  path: '/poivelle',
  meta: {
    auth: true,
    appName: 'poivelle'
  },
  component: () => import('@/layouts/Poivelle.vue'),
  children: [
    {
      path: '',
      name: ROUTE_POIVELLE_INDEX,
      component: () => import('@/pages/poivelle/Index.vue')
    }
  ]
};
