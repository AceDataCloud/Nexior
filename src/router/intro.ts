import { ROUTE_INTRO } from './constants';

// Capability-first product tour. /home sells the white-label business;
// /intro sells what the platform can actually do.
export default {
  path: '/intro',
  component: () => import('@/layouts/Index.vue'),
  children: [
    {
      path: '',
      name: ROUTE_INTRO,
      component: () => import('@/pages/intro/Index.vue'),
      meta: { auth: false }
    }
  ]
};
