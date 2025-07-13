import { CHAT_MODEL_GROUP_GROK } from '@/constants';
import { ROUTE_GROK_CONVERSATION, ROUTE_GROK_CONVERSATION_NEW } from './constants';

export default {
  path: '/grok',
  meta: {
    modelGroup: CHAT_MODEL_GROUP_GROK
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_GROK_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations',
      name: ROUTE_GROK_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations/:id',
      name: ROUTE_GROK_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
