import { ROUTE_WAN_INDEX } from './constants';

export default {
  path: '/wan',
  meta: {
    auth: true,
    appName: 'wan'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_WAN_INDEX,
      component: () => import('@/pages/wan/Index.vue')
    }
  ]
};
