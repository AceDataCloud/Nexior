import { ROUTE_CODING_BRIDGE_INDEX } from './constants';

export default {
  path: '/coding-bridge',
  meta: {
    auth: true,
    appName: 'codingBridge'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_CODING_BRIDGE_INDEX,
      component: () => import('@/pages/codingBridge/Index.vue')
    }
  ]
};
