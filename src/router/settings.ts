import { ROUTE_SETTINGS_INDEX } from './constants';

export default {
  path: '/settings',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SETTINGS_INDEX,
      component: () => import('@/pages/settings/Index.vue')
    }
  ]
};
