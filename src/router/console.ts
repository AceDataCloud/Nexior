export default {
  path: '/console',
  name: 'console',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Console.vue'),
  children: [
    {
      path: 'orders',
      name: 'console-order-list',
      component: () => import('@/pages/console/order/List.vue')
    },
    {
      path: 'orders/:id',
      name: 'console-order-detail',
      component: () => import('@/pages/console/order/Detail.vue')
    },
    {
      path: 'applications',
      name: 'console-application-list',
      component: () => import('@/pages/console/application/List.vue')
    }
  ]
};
