import { ROUTE_PROFILE_INDEX } from './constants';

export default {
  path: '/profile',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_PROFILE_INDEX,
      component: () => import('@/pages/profile/Index.vue')
    }
  ]
};
