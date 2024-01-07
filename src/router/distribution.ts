import { ROUTE_DISTRIBUTION_HISTORY, ROUTE_DISTRIBUTION_INDEX, ROUTE_DISTRIBUTION_INVITEES } from './constants';

export default {
  path: '/distribution',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_DISTRIBUTION_INDEX,
      component: () => import('@/pages/distribution/Index.vue')
    },
    {
      path: 'history',
      name: ROUTE_DISTRIBUTION_HISTORY,
      component: () => import('@/pages/distribution/History.vue')
    },
    {
      path: 'invitees',
      name: ROUTE_DISTRIBUTION_INVITEES,
      component: () => import('@/pages/distribution/Invitees.vue')
    }
  ]
};
