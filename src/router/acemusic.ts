import { ROUTE_ACEMUSIC_INDEX } from './constants';
export default {
  path: '/acemusic',
  meta: { auth: true, appName: 'acemusic' },
  component: () => import('@/layouts/Main.vue'),
  children: [{ path: '', name: ROUTE_ACEMUSIC_INDEX, component: () => import('@/pages/acemusic/Index.vue') }]
};
