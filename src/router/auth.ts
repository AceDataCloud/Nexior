import { t } from '../i18n';

export default {
  path: '/auth',
  name: 'auth',
  meta: {
    title: t('common.nav.content')
  },
  component: () => import('@/layouts/Auth.vue'),
  children: [
    {
      path: 'login',
      name: 'auth-login',
      meta: {
        title: t('common.nav.article')
      },
      component: () => import('@/pages/auth/Login.vue')
    }
  ]
};
