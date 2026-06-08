import { ROUTE_DOWNLOAD } from './constants';

export default {
  path: '/download',
  component: () => import('@/layouts/Bare.vue'),
  children: [
    {
      path: '',
      name: ROUTE_DOWNLOAD,
      component: () => import('@/pages/download/Index.vue')
    }
  ]
};
