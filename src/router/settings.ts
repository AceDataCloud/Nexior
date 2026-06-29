import { ROUTE_SETTINGS_INDEX, ROUTE_SETTINGS_LOCAL_TOOLS } from './constants';

export default {
  path: '/settings',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SETTINGS_INDEX,
      component: () => import('@/pages/settings/Index.vue')
    },
    {
      path: 'local-tools',
      name: ROUTE_SETTINGS_LOCAL_TOOLS,
      component: () => import('@/pages/settings/LocalTools.vue')
    }
  ]
};
