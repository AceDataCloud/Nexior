import { ROUTE_DIGITALHUMAN_INDEX } from './constants';

export default {
  path: '/digital-human',
  meta: {
    auth: true,
    appName: 'digitalhuman'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_DIGITALHUMAN_INDEX,
      component: () => import('@/pages/digitalhuman/Index.vue')
    }
  ]
};
