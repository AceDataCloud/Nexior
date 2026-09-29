import { CHAT_MODEL_GROUP_CHATGPT } from '@/constants';
import { isMainOfficial, isWeb } from '@/utils';
import {
  ROUTE_CHATGPT_CALL,
  ROUTE_CHATGPT_CONVERSATION,
  ROUTE_CHATGPT_CONVERSATION_NEW,
  ROUTE_CHAT_SCHEDULED_TASKS,
  ROUTE_CHAT_ARTIFACTS,
  ROUTE_INDEX
} from './constants';

const mainOfficialOnly = () => (isMainOfficial() || !isWeb() ? true : { name: ROUTE_INDEX, replace: true });

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
    },
    {
      path: 'call',
      name: ROUTE_CHATGPT_CALL,
      // Voice call uses the realtime store module (openai service), not chat.
      meta: { appName: 'realtime' },
      component: () => import('@/pages/chat/RealtimeCall.vue')
    },
    {
      path: 'scheduled',
      name: ROUTE_CHAT_SCHEDULED_TASKS,
      beforeEnter: mainOfficialOnly,
      component: () => import('@/pages/chat/ScheduledTasks.vue')
    },
    {
      path: 'artifacts',
      name: ROUTE_CHAT_ARTIFACTS,
      beforeEnter: mainOfficialOnly,
      component: () => import('@/pages/chat/Artifacts.vue')
    }
  ]
};
