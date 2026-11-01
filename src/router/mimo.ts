import { CHAT_MODEL_GROUP_MIMO } from '@/constants';
import { ROUTE_MIMO_CONVERSATION, ROUTE_MIMO_CONVERSATION_NEW } from './constants';

export default {
  path: '/mimo',
  meta: {
    modelGroup: CHAT_MODEL_GROUP_MIMO,
    appName: 'chat'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_MIMO_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations/:id',
      name: ROUTE_MIMO_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations',
      name: ROUTE_MIMO_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
