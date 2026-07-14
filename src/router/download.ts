import { ROUTE_DOWNLOAD, ROUTE_INDEX } from './constants';
import { isMainOfficial } from '@/utils';

export default {
  path: '/download',
  component: () => import('@/layouts/Bare.vue'),
  children: [
    {
      path: '',
      name: ROUTE_DOWNLOAD,
      // The mobile-app download page only exists on the official main host;
      // block direct URL access on subsites / white-label tenants.
      beforeEnter: () => (isMainOfficial() ? true : { name: ROUTE_INDEX }),
      component: () => import('@/pages/download/Index.vue')
    }
  ]
};
