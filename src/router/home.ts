import type { RouteLocationGeneric } from 'vue-router';
import { ROUTE_INDEX } from './constants';

export default {
  path: '/',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_INDEX,
      component: () => import('@/pages/home/Index.vue'),
      meta: { auth: false }
    }
  ]
};

export const homeCompatibilityRoute = {
  path: '/home',
  redirect: (to: RouteLocationGeneric) => ({ name: ROUTE_INDEX, query: to.query, hash: to.hash, replace: true })
};
