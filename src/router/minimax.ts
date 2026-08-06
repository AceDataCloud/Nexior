import { ROUTE_MINIMAX_INDEX } from './constants';

export default {
  path: '/minimax',
  meta: {
    auth: true,
    appName: 'minimax'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_MINIMAX_INDEX,
      component: () => import('@/pages/minimax/Index.vue')
    }
  ]
};
