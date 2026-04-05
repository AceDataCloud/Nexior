import { CHAT_MODEL_GROUP_KIMI } from '@/constants';
import { ROUTE_KIMI_CONVERSATION, ROUTE_KIMI_CONVERSATION_NEW } from './constants';

export default {
  path: '/kimi',
  meta: {
    modelGroup: CHAT_MODEL_GROUP_KIMI,
    appName: 'chat'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_KIMI_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations/:id',
      name: ROUTE_KIMI_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations',
      name: ROUTE_KIMI_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
