import { ROUTE_PIXVERSE_INDEX } from './constants';

export default {
  path: '/pixverse',
  meta: {
    auth: true,
    appName: 'pixverse'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_PIXVERSE_INDEX,
      component: () => import('@/pages/pixverse/Index.vue')
    }
  ]
};
