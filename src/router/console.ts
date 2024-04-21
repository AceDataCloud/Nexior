import {
  ROUTE_CONSOLE_APPLICATION_BUY,
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_ORDER_DETAIL,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_CONSOLE_ROOT,
  ROUTE_CONSOLE_USAGE_LIST
} from './constants';

export default {
  path: '/console',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Console.vue'),
  children: [
    {
      path: '',
      name: ROUTE_CONSOLE_ROOT,
      redirect: {
        name: ROUTE_CONSOLE_APPLICATION_LIST
      }
    },
    {
      path: 'orders',
      name: ROUTE_CONSOLE_ORDER_LIST,
      component: () => import('@/pages/console/order/List.vue')
    },
    {
      path: 'orders/:id',
      name: ROUTE_CONSOLE_ORDER_DETAIL,
      component: () => import('@/pages/console/order/Detail.vue')
    },
    {
      path: 'applications',
      name: ROUTE_CONSOLE_APPLICATION_LIST,
      component: () => import('@/pages/console/application/List.vue')
    },
    {
      path: 'applications/:id/buy',
      name: ROUTE_CONSOLE_APPLICATION_BUY,
      component: () => import('@/pages/console/application/Buy.vue')
    },
    {
      path: 'usages',
      name: ROUTE_CONSOLE_USAGE_LIST,
      component: () => import('@/pages/console/usage/List.vue')
    }
  ]
};
