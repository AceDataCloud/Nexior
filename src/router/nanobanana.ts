import { ROUTE_NANOBANANA_INDEX } from './constants';

export default {
  path: '/nanobanana',
  meta: {
    auth: true,
    appName: 'nanobanana'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_NANOBANANA_INDEX,
      component: () => import('@/pages/nanobanana/Index.vue')
    }
  ]
};

