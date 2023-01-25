import { ROUTE_DOCUMENT_DETAIL, ROUTE_DOCUMENT_LIST } from './constants';

export default {
  path: '/documents',
  component: () => import('@/layouts/Document.vue'),
  children: [
    {
      path: '',
      name: ROUTE_DOCUMENT_LIST,
      component: () => import('@/pages/document/List.vue')
    },
    {
      path: ':id',
      name: ROUTE_DOCUMENT_DETAIL,
      component: () => import('@/pages/document/Detail.vue')
    }
  ]
};
