import { ROUTE_SERVICE_DETAIL, ROUTE_SERVICE_LIST, ROUTE_SERVICE_ROOT } from './constants';

export default {
  path: '/services',
  component: () => import('@/layouts/Service.vue'),
  children: [
    {
      path: '',
      name: ROUTE_SERVICE_LIST,
      component: () => import('@/pages/service/List.vue')
    },
    {
      path: ':id',
      name: ROUTE_SERVICE_DETAIL,
      component: () => import('@/pages/service/Detail.vue')
    }
  ]
};
