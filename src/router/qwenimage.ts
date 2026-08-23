import { ROUTE_QWENIMAGE_INDEX } from './constants';

export default {
  path: '/qwen-image',
  meta: {
    auth: true,
    appName: 'qwenimage'
  },
  component: () => import('@/layouts/Main.vue'),
  children: [
    {
      path: '',
      name: ROUTE_QWENIMAGE_INDEX,
      component: () => import('@/pages/qwenimage/Index.vue')
    }
  ]
};
