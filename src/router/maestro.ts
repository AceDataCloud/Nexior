import { ROUTE_MAESTRO_INDEX } from './constants';

export default {
  path: '/maestro',
  meta: {
    auth: true,
    appName: 'maestro'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_MAESTRO_INDEX,
      component: () => import('@/pages/maestro/Index.vue')
    }
  ]
};
