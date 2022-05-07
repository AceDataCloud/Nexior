export default {
  path: '/categories',
  name: 'categories',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Category.vue'),
  children: [
    {
      path: '',
      name: 'category-list',
      component: () => import('@/pages/category/List.vue')
    }
  ]
};
