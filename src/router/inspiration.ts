import {
  ROUTE_INSPIRATION_ALL,
  ROUTE_INSPIRATION_IMAGES,
  ROUTE_INSPIRATION_MUSIC,
  ROUTE_INSPIRATION_VIDEOS
} from './constants';

export default {
  path: '/inspiration',
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_INSPIRATION_ALL,
      component: () => import('@/pages/inspiration/Index.vue'),
      meta: { auth: false }
    },
    {
      path: 'images',
      name: ROUTE_INSPIRATION_IMAGES,
      component: () => import('@/pages/inspiration/Index.vue'),
      meta: { auth: false }
    },
    {
      path: 'videos',
      name: ROUTE_INSPIRATION_VIDEOS,
      component: () => import('@/pages/inspiration/Index.vue'),
      meta: { auth: false }
    },
    {
      path: 'music',
      name: ROUTE_INSPIRATION_MUSIC,
      component: () => import('@/pages/inspiration/Index.vue'),
      meta: { auth: false }
    }
  ]
};
