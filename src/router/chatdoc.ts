import {
  ROUTE_CHATDOC_CONVERSATION,
  ROUTE_CHATDOC_CONVERSATION_NEW,
  ROUTE_CHATDOC_INDEX,
  ROUTE_CHATDOC_MANAGE,
  ROUTE_CHATDOC_SETTING
} from './constants';

export default {
  path: '/chatdoc',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_CHATDOC_INDEX,
      component: () => import('@/pages/chatdoc/Index.vue')
    },
    {
      path: 'repositories/:repositoryId/conversations',
      name: ROUTE_CHATDOC_CONVERSATION_NEW,
      component: () => import('@/pages/chatdoc/Conversation.vue')
    },
    {
      path: 'repositories/:repositoryId/conversations/:conversationId',
      name: ROUTE_CHATDOC_CONVERSATION,
      component: () => import('@/pages/chatdoc/Conversation.vue')
    },
    {
      path: 'repositories/:repositoryId/manage',
      name: ROUTE_CHATDOC_MANAGE,
      component: () => import('@/pages/chatdoc/Manage.vue')
    },
    {
      path: 'repositories/:repositoryId',
      name: ROUTE_CHATDOC_SETTING,
      component: () => import('@/pages/chatdoc/Setting.vue')
    }
  ]
};
