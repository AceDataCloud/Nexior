export default {
  path: '/orders',
  name: 'orders',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Order.vue'),
  children: [
    {
      path: '',
      name: 'order-list',
      component: () => import('@/pages/order/List.vue')
    },
    {
      path: ':id',
      name: 'order-detail',
      component: () => import('@/pages/order/Detail.vue')
    }
  ]
};
