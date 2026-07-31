import {
  ROUTE_CONSOLE_APPLICATION_EXTRA,
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
  ROUTE_CONSOLE_CONNECTORS,
  ROUTE_CONSOLE_ORDER_DETAIL,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_CONSOLE_ROOT,
  ROUTE_CONSOLE_SKILLS,
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
    // Connector management, ported from auth.acedata.cloud/user/connections.
    // The route always exists (so a deep link works for testers); the sidebar
    // entry and the in-app links are gated on the `connections-in-studio`
    // feature flag. AuthFrontend's page stays live for PlatformFrontend/Dify.
    {
      path: 'connectors',
      name: ROUTE_CONSOLE_CONNECTORS,
      meta: { layout: 'workspace' },
      component: () => import('@/pages/console/connectors/Index.vue')
    },
    // Agent Skills, same deal — ported UI, same flag, AuthFrontend's page
    // stays live.
    {
      path: 'skills',
      name: ROUTE_CONSOLE_SKILLS,
      meta: { layout: 'workspace' },
      component: () => import('@/pages/console/skills/Index.vue')
    }
  ]
};
