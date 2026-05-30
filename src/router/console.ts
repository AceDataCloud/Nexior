import {
  ROUTE_CONSOLE_APPLICATION_EXTRA,
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
  ROUTE_CONSOLE_DISTRIBUTION_HISTORY,
  ROUTE_CONSOLE_DISTRIBUTION_INDEX,
  ROUTE_CONSOLE_DISTRIBUTION_INVITEES,
  ROUTE_CONSOLE_DISTRIBUTION_RANK,
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
      path: 'applications/:id/extra',
      name: ROUTE_CONSOLE_APPLICATION_EXTRA,
      component: () => import('@/pages/console/application/Extra.vue')
    },
    {
      path: 'applications/:id/subscribe',
      name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
      component: () => import('@/pages/console/application/Subscribe.vue')
    },
    {
      path: 'usages',
      name: ROUTE_CONSOLE_USAGE_LIST,
      component: () => import('@/pages/console/usage/List.vue')
    },
    {
      path: 'distributions',
      name: ROUTE_CONSOLE_DISTRIBUTION_INDEX,
      component: () => import('@/pages/console/distribution/Index.vue')
    },
    {
      path: 'distribution-histories',
      name: ROUTE_CONSOLE_DISTRIBUTION_HISTORY,
      component: () => import('@/pages/console/distribution/History.vue')
    },
    {
      path: 'distribution-rank',
      name: ROUTE_CONSOLE_DISTRIBUTION_RANK,
      component: () => import('@/pages/console/distribution/Rank.vue')
    },
    {
      path: 'distribution-invitees',
      name: ROUTE_CONSOLE_DISTRIBUTION_INVITEES,
      component: () => import('@/pages/console/distribution/Invitees.vue')
    }
  ]
};
