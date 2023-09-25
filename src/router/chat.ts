import { ROUTE_AUTH_CALLBACK, ROUTE_AUTH_LOGIN, ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_INDEX } from './constants';

export default {
  path: '/chat',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_CHAT_INDEX,
      component: () => import('@/pages/chat/Index.vue')
    },
    {
      path: 'conversation/:id',
      name: ROUTE_CHAT_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
