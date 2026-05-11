import { ROUTE_WEBEXTRATOR_INDEX } from './constants';

export default {
  path: '/webextrator',
  meta: {
    auth: true,
    appName: 'webextrator'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_WEBEXTRATOR_INDEX,
      component: () => import('@/pages/webextrator/Index.vue')
    }
  ]
};
