import { ROUTE_DOWNLOAD } from './constants';

export default {
  path: '/download',
  component: () => import('@/layouts/Index.vue'),
  children: [
    {
      path: '',
      name: ROUTE_DOWNLOAD,
      component: () => import('@/pages/download/Index.vue')
    }
  ]
};
