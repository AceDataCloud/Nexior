import { ROUTE_QRART_HISTORY, ROUTE_QRART_INDEX } from './constants';

export default {
  path: '/qrart',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_QRART_INDEX,
      component: () => import('@/pages/qrart/Index.vue')
    },
    {
      path: 'history',
      name: ROUTE_QRART_HISTORY,
      component: () => import('@/pages/qrart/History.vue')
    }
  ]
};
