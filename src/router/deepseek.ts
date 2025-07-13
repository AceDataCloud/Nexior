import { CHAT_MODEL_GROUP_DEEPSEEK } from '@/constants';
import { ROUTE_DEEPSEEK_CONVERSATION, ROUTE_DEEPSEEK_CONVERSATION_NEW } from './constants';

export default {
  path: '/deepseek',
  meta: {
    modelGroup: CHAT_MODEL_GROUP_DEEPSEEK
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_DEEPSEEK_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations/:id',
      name: ROUTE_DEEPSEEK_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations',
      name: ROUTE_DEEPSEEK_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
