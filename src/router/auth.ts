import { ROUTE_AUTH_CALLBACK, ROUTE_AUTH_LOGIN } from './constants';

export default {
  path: '/auth',
  component: () => import('@/layouts/Auth.vue'),
  children: [
    {
      path: 'login',
      name: ROUTE_AUTH_LOGIN,
      component: () => import('@/pages/auth/Login.vue')
    },
    {
      path: 'callback',
      name: ROUTE_AUTH_CALLBACK,
      component: () => import('@/pages/auth/Callback.vue')
    }
  ]
};
