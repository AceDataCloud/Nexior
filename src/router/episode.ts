export default {
  path: '/courses/:courseId/episodes/',
  name: 'episodes',
  meta: {
    auth: true
  },
  component: () => import('@/layouts/Episode.vue'),
  children: [
    {
      path: ':id',
      name: 'episode-detail',
      component: () => import('@/pages/episode/Detail.vue')
    }
  ]
};
