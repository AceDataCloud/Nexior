import { ROUTE_OMNI_INDEX } from './constants';

export default {
  path: '/omni',
  meta: {
    auth: true,
    appName: 'omni'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_OMNI_INDEX,
      component: () => import('@/pages/omni/Index.vue')
    }
  ]
};
