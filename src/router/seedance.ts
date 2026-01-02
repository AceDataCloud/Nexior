import { ROUTE_SEEDANCE_INDEX } from './constants';

export default {
  path: '/seedance',
  meta: {
    auth: true,
    appName: 'seedance'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SEEDANCE_INDEX,
      component: () => import('@/pages/seedance/Index.vue')
    }
  ]
};
