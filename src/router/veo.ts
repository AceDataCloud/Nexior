import { ROUTE_VEO_INDEX } from './constants';

export default {
  path: '/veo',
  meta: {
    auth: true,
    appName: 'veo'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_VEO_INDEX,
      component: () => import('@/pages/veo/Index.vue')
    }
  ]
};
