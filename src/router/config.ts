import { ROUTE_CONFIG_INDEX } from './constants';

export default {
  path: '/config',
  component: () => import('@/layouts/Config.vue'),
  children: [
    {
      path: '',
      name: ROUTE_CONFIG_INDEX,
      component: () => import('@/pages/config/Index.vue')
    }
  ]
};
