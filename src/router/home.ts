import { ROUTE_INDEX } from './constants';

// Marketing landing page. Mounted at /home (NOT /) so the existing "/ →
// first enabled service" redirect that greets returning users is untouched.
// Named ROUTE_INDEX so the logo / nav "go home" actions (TopHeader, Navigator,
// SidePanel, DeleteAccountDialog) resolve here instead of a missing route.
export default {
  path: '/home',
  component: () => import('@/layouts/Index.vue'),
  children: [
    {
      path: '',
      name: ROUTE_INDEX,
      component: () => import('@/pages/index/Index.vue'),
      meta: { auth: false }
    }
  ]
};
