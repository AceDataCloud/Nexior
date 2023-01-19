export default {
  path: '/documents',
  name: 'documents',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Document.vue'),
  children: [
    {
      path: ':id',
      name: 'document-detail',
      component: () => import('@/pages/document/Detail.vue')
    }
  ]
};
