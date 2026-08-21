// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AnalyticsSetting from './Analytics.vue';
import SectionNotice from './SectionNotice.vue';

const translations: Record<string, string> = {
  'common.settings.adminOnlyHint': '此栏目仅站点管理员可见，普通用户无法访问。',
  'common.button.save': '保存'
};

const mountComponent = () =>
  shallowMount(AnalyticsSetting, {
    global: {
      mocks: {
        $t: (key: string) => translations[key] || key,
        $store: { state: { site: { id: 'site-1', analytics: {} } }, dispatch: () => Promise.resolve() }
      },
      stubs: {
        ElAlert: true,
        ElButton: { template: '<button><slot /></button>' },
        ElForm: { template: '<form><slot /></form>' },
        ElFormItem: { template: '<div><slot /></div>' },
        ElInput: true,
        ElSwitch: true
      }
    }
  });

describe('setting/Analytics', () => {
  it('shows the site-admin-only notice', () => {
    const notice = mountComponent().findComponent(SectionNotice);
    expect(notice.exists()).toBe(true);
    expect(notice.props()).toMatchObject({
      tone: 'admin',
      text: '此栏目仅站点管理员可见，普通用户无法访问。'
    });
  });

  it('renders the localized save label instead of the translation key', () => {
    const text = mountComponent().find('.actions button').text();
    expect(text).toBe('保存');
    expect(text).not.toContain('common.button.save');
  });
});
