export default {
  path: '/course',
  name: 'course',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Course.vue'),
  children: [
    {
      path: '',
      name: 'course-list',
      component: () => import('@/pages/course/List.vue')
    }
  ]
};
