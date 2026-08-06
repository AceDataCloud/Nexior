import { ROUTE_BUSINESS } from './constants';

// White-label business, branding, pricing, and referral presentation.
export default {
  path: '/business',
  component: () => import('@/layouts/Index.vue'),
  children: [
    {
      path: '',
      name: ROUTE_BUSINESS,
      component: () => import('@/pages/business/Index.vue'),
      meta: { auth: false }
    }
  ]
};
