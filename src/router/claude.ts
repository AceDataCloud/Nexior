import { CHAT_MODEL_GROUP_CLAUDE } from '@/constants';
import { ROUTE_CLAUDE_CONVERSATION, ROUTE_CLAUDE_CONVERSATION_NEW } from './constants';

export default {
  path: '/claude',
  meta: {
    modelGroup: CHAT_MODEL_GROUP_CLAUDE,
    appName: 'chat'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_CLAUDE_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations',
      name: ROUTE_CLAUDE_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations/:id',
      name: ROUTE_CLAUDE_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
