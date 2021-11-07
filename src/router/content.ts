import { t } from '../i18n';

export default {
  path: '/content',
  name: 'content',
  meta: {
    title: t('common.nav.content'),
    auth: true
  },
  component: () => import('@/layouts/Content.vue'),
  children: [
    {
      path: '',
      redirect: {
        name: 'article-index'
      }
    },
    {
      path: 'article',
      name: 'article-index',
      meta: {
        title: t('common.nav.article')
      },
      component: () => import('@/pages/content/article/Index.vue')
    },
    {
      path: 'article/:id',
      name: 'article-detail',
      meta: {
        title: t('common.nav.article')
      },
      component: () => import('@/pages/content/article/Detail.vue')
    },
    {
      path: 'article/:id/publish',
      name: 'article-publish',
      meta: {
        title: t('common.nav.article')
      },
      component: () => import('@/pages/content/article/Publish.vue')
    },
    {
      path: 'platform',
      name: 'platform-index',
      meta: {
        title: t('common.nav.platform')
      },
      component: () => import('@/pages/content/platform/Index.vue')
    },
    {
      path: 'publication',
      name: 'publication-index',
      meta: {
        title: t('common.nav.publication')
      },
      component: () => import('@/pages/content/publication/Index.vue')
    }
  ]
};
