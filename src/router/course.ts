export default {
  path: '/courses',
  name: 'courses',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Course.vue'),
  children: [
    {
      path: '',
      name: 'course-list',
      component: () => import('@/pages/course/List.vue')
    },
    {
      path: ':id',
      name: 'course-detail',
      component: () => import('@/pages/course/Detail.vue')
    }
  ]
};
