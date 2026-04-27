import { ROUTE_CONNECTORS_INDEX, ROUTE_CONNECTORS_BROWSE } from './constants';

export default {
  path: '/connectors',
  meta: {
    auth: true,
    // Reuse the chat app context so Main.vue auto-fetches a chat application
    // and provisions an aichat2 credential token (used by connector/MCP APIs).
    appName: 'chat'
  },
  children: [
    {
      path: '',
      component: () => import('@/layouts/Main.vue'),
      meta: { auth: true, appName: 'chat' },
      children: [
        {
          path: '',
          name: ROUTE_CONNECTORS_INDEX,
          component: () => import('@/pages/connectors/Index.vue')
        },
        {
          path: 'browse',
          name: ROUTE_CONNECTORS_BROWSE,
          component: () => import('@/pages/connectors/Browse.vue')
        }
      ]
    }
  ]
};
