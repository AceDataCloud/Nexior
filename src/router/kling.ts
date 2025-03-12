import { ROUTE_KLING_INDEX } from './constants';

export default {
  path: '/kling',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_KLING_INDEX,
      component: () => import('@/pages/kling/Index.vue')
    }
  ]
};
