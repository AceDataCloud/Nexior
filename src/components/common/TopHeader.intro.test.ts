// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { ROUTE_INTRO } from '@/router';
import TopHeader from './TopHeader.vue';

const mountHeader = (routeName: string) =>
  shallowMount(TopHeader, {
    global: {
      stubs: {
        ElRow: { template: '<header><slot /></header>' },
        ElCol: { template: '<div><slot /></div>' },
        Logo: { template: '<div class="logo-stub" />' },
        ElMenu: { template: '<nav class="menu-stub"><slot /></nav>' },
        ElSubMenu: true,
        ElMenuItem: true,
        ElDropdown: true,
        ElButton: { template: '<button class="login-stub"><slot /></button>' }
      },
      mocks: {
        $t: (key: string) => key,
        $route: { name: routeName, matched: [{ path: '/intro' }], fullPath: '/intro' },
        $router: { push: vi.fn() },
        $store: {
          state: { site: { id: 'studio', title: 'Ace Data Cloud', features: {} } },
          getters: { authenticated: true, dark: true, user: { avatar: 'avatar.png' } },
          dispatch: vi.fn()
        }
      }
    }
  });

describe('TopHeader /intro presentation mode', () => {
  it('renders only the centered brand logo', () => {
    const wrapper = mountHeader(ROUTE_INTRO);

    expect(wrapper.classes()).toContain('minimal-only');
    expect(wrapper.findAll('.logo-stub')).toHaveLength(1);
    expect(wrapper.find('.menu-stub').exists()).toBe(false);
    expect(wrapper.find('.login-stub').exists()).toBe(false);
    expect(wrapper.find('.avatar').exists()).toBe(false);
    expect(wrapper.find('.console').exists()).toBe(false);
  });
});
