import { ROUTE_CONVERSATION_DETAIL, ROUTE_CONVERSATION_NEW, ROUTE_DOCUMENT_LIST } from './constants';

export default {
  path: '/conversations',
  component: () => import('@/layouts/Conversation.vue'),
  children: [
    {
      path: '',
      name: ROUTE_CONVERSATION_NEW,
      component: () => import('@/pages/conversation/New.vue')
    },
    {
      path: ':id',
      name: ROUTE_CONVERSATION_DETAIL,
      component: () => import('@/pages/conversation/Detail.vue')
    }
  ]
};
