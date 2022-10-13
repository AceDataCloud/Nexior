export default {
  path: '/orders',
  name: 'orders',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Order.vue'),
  children: [
    {
      path: ':id',
      name: 'order-detail',
      component: () => import('@/pages/order/Detail.vue')
    }
  ]
};
