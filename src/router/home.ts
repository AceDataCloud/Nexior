import { ROUTE_INDEX } from './constants';

// Capability-first public product home. Keep `/` reserved for returning users:
// it still redirects to the first enabled service instead of a marketing page.
export default {
  path: '/home',
  component: () => import('@/layouts/Index.vue'),
  children: [
    {
      path: '',
      name: ROUTE_INDEX,
      component: () => import('@/pages/home/Index.vue'),
      meta: { auth: false }
    }
  ]
};
