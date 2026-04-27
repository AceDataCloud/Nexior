import { ROUTE_CONNECTORS_INDEX, ROUTE_CONNECTORS_BROWSE, ROUTE_CONNECTORS_OAUTH_CALLBACK } from './constants';

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
      // OAuth popup callback — must NOT require auth (popup may not have session) and
      // must NOT load the heavy Main layout (it just postMessages back to opener).
      path: 'oauth/callback',
      name: ROUTE_CONNECTORS_OAUTH_CALLBACK,
      component: () => import('@/pages/connectors/OAuthCallback.vue'),
      meta: { auth: false }
    },
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
