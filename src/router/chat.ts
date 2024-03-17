import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from './constants';

export default {
  path: '/chat',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_CHAT_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations',
      name: ROUTE_CHAT_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations/:id',
      name: ROUTE_CHAT_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
