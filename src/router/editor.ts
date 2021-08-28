import { t } from '../i18n';

export default {
  path: '/editor',
  name: 'editor',
  meta: {
    title: t('common.nav.editor')
  },
  component: () => import('@/layouts/Editor.vue'),
  children: [
    {
      path: 'article/:id',
      name: 'article-edit',
      meta: {
        title: t('common.nav.article')
      },
      component: () => import('@/pages/editor/article/Detail.vue')
    }
  ]
};
