import { CHAT_MODEL_GROUP_GEMINI } from '@/constants';
import { ROUTE_GEMINI_CONVERSATION, ROUTE_GEMINI_CONVERSATION_NEW } from './constants';

export default {
  path: '/gemini',
  meta: {
    modelGroup: CHAT_MODEL_GROUP_GEMINI,
    appName: 'chat'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_GEMINI_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations',
      name: ROUTE_GEMINI_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations/:id',
      name: ROUTE_GEMINI_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
