import { ROUTE_MIDJOURNEY_HISTORY, ROUTE_MIDJOURNEY_INDEX } from './constants';

export default {
  path: '/midjourney',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_MIDJOURNEY_INDEX,
      component: () => import('@/pages/midjourney/Index.vue')
    },
    {
      path: 'history',
      name: ROUTE_MIDJOURNEY_HISTORY,
      component: () => import('@/pages/midjourney/History.vue')
    }
  ]
};
