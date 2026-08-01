import {
  ROUTE_CONSOLE_APPLICATION_EXTRA,
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
  ROUTE_CONSOLE_BROWSER_DEVICES,
  ROUTE_CONSOLE_CONNECTORS,
  ROUTE_CONSOLE_ORDER_DETAIL,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_CONSOLE_ROOT,
  ROUTE_CONSOLE_SKILLS,
  ROUTE_CONSOLE_USAGE_LIST
} from './constants';

// Which shape of `.panel` the layout gives a page. There is no single mode
// that serves both: `document` lets the panel scroll (a workspace page would
// then stretch to its content and its panes would never scroll), while
// `workspace` clips the panel so each pane scrolls itself (a document page
// would then have unreachable overflow). Every route states its own, so
// adding a page is a deliberate choice rather than an inherited default.
const DOCUMENT = { layout: 'document' };
const WORKSPACE = { layout: 'workspace' };

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
      meta: DOCUMENT,
      component: () => import('@/pages/console/order/List.vue')
    },
    {
      path: 'orders/:id',
      name: ROUTE_CONSOLE_ORDER_DETAIL,
      meta: DOCUMENT,
      component: () => import('@/pages/console/order/Detail.vue')
    },
    {
      path: 'applications',
      name: ROUTE_CONSOLE_APPLICATION_LIST,
      meta: DOCUMENT,
      component: () => import('@/pages/console/application/List.vue')
    },
    {
      path: 'applications/:id/extra',
      name: ROUTE_CONSOLE_APPLICATION_EXTRA,
      meta: DOCUMENT,
      component: () => import('@/pages/console/application/Extra.vue')
    },
    {
      path: 'applications/:id/subscribe',
      name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
      meta: DOCUMENT,
      component: () => import('@/pages/console/application/Subscribe.vue')
    },
    {
      path: 'usages',
      name: ROUTE_CONSOLE_USAGE_LIST,
      meta: DOCUMENT,
      component: () => import('@/pages/console/usage/List.vue')
    },
    // Connector management. auth.acedata.cloud stays the OAuth broker and
    // credential vault; its page also stays live because PlatformFrontend
    // links to it and ~28 MCP servers register it as an OAuth redirect_uri.
    {
      path: 'connectors',
      name: ROUTE_CONSOLE_CONNECTORS,
      meta: WORKSPACE,
      component: () => import('@/pages/console/connectors/Index.vue')
    },
    // Agent Skills — same split: UI here, data still owned by AuthBackend.
    {
      path: 'skills',
      name: ROUTE_CONSOLE_SKILLS,
      meta: WORKSPACE,
      component: () => import('@/pages/console/skills/Index.vue')
    },
    // Browser devices — the extensions paired to run browser work locally.
    // Ported from auth.acedata.cloud/user/browser-devices; a plain scrolling
    // list, so DOCUMENT rather than the connector/skill WORKSPACE layout.
    {
      path: 'browser-devices',
      name: ROUTE_CONSOLE_BROWSER_DEVICES,
      meta: DOCUMENT,
      component: () => import('@/pages/console/browserDevices/Index.vue')
    }
  ]
};
