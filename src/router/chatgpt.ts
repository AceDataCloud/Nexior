import { CHAT_MODEL_GROUP_CHATGPT } from '@/constants';
import { ROUTE_CHATGPT_CONVERSATION, ROUTE_CHATGPT_CONVERSATION_NEW } from './constants';

export default {
  path: '/chatgpt',
  meta: {
    modelGroup: CHAT_MODEL_GROUP_CHATGPT,
    appName: 'chat'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: ROUTE_CHATGPT_CONVERSATION_NEW
      }
    },
    {
      path: 'conversations',
      name: ROUTE_CHATGPT_CONVERSATION_NEW,
      component: () => import('@/pages/chat/Conversation.vue')
    },
    {
      path: 'conversations/:id',
      name: ROUTE_CHATGPT_CONVERSATION,
      component: () => import('@/pages/chat/Conversation.vue')
    }
  ]
};
