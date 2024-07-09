import { ROUTE_SUNO_INDEX } from './constants';

export default {
  path: '/suno',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SUNO_INDEX,
      component: () => import('@/pages/suno/Index.vue')
    }
  ]
};
