import { ROUTE_PRODUCER_INDEX } from './constants';

export default {
  path: '/producer',
  meta: {
    auth: true,
    appName: 'producer'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_PRODUCER_INDEX,
      component: () => import('@/pages/producer/Index.vue')
    }
  ]
};
