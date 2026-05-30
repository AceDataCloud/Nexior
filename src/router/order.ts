import { ROUTE_ORDER_PUBLIC_PAY } from './constants';

export default {
  path: '/orders',
  component: () => import('@/layouts/Index.vue'),
  children: [
    {
      path: ':id',
      name: ROUTE_ORDER_PUBLIC_PAY,
      component: () => import('@/pages/order/Pay.vue'),
      meta: { auth: false }
    }
  ]
};
