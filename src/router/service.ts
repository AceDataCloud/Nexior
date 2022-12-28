export default {
  path: '/services',
  name: 'services',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Service.vue'),
  children: [
    {
      path: '',
      name: 'service-list',
      component: () => import('@/pages/service/List.vue')
    },
    {
      path: ':id',
      name: 'service-detail',
      component: () => import('@/pages/service/Detail.vue')
    }
  ]
};
