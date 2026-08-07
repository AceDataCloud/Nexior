// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BottomFooter from './BottomFooter.vue';

const mountFooter = (site: Record<string, unknown>, host = 'tenant.example.com') => {
  vi.stubGlobal('location', { host });
  return shallowMount(BottomFooter, {
    global: {
      stubs: {
        ElContainer: { template: '<footer><slot /></footer>' },
        ElRow: { template: '<div><slot /></div>' },
        ElCol: { template: '<div><slot /></div>' },
        FontAwesomeIcon: { template: '<span class="github-icon" />' }
      },
      mocks: {
        $t: (key: string) => (key === 'common.entity.copyright' ? '版权所有' : key),
        $store: { state: { site } }
      }
    }
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BottomFooter site branding', () => {
  it('uses the tenant title with the current year', () => {
    const wrapper = mountFooter({ title: 'turboclaw', branding: {} });

    expect(wrapper.text()).toContain(`turboclaw © ${new Date().getFullYear()} 版权所有`);
    expect(wrapper.text()).not.toContain('Ace Data Cloud');
    expect(wrapper.find('a[href="/"]').text()).toBe('turboclaw');
    expect(wrapper.find('.github-icon').exists()).toBe(false);
  });

  it('prefers the complete custom copyright', () => {
    const wrapper = mountFooter({ title: 'turboclaw', branding: { copyright: '© 2026 TurboClaw Ltd.' } });

    expect(wrapper.text()).toContain('© 2026 TurboClaw Ltd.');
    expect(wrapper.text()).not.toContain('版权所有');
  });

  it('keeps the first-party GitHub link on the official host', () => {
    const wrapper = mountFooter({ title: 'Ace Data Cloud' }, 'studio.acedata.cloud');

    expect(wrapper.find('a[href="https://github.com/AceDataCloud/Nexior"]').exists()).toBe(true);
  });
});
