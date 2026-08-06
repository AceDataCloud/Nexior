// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { ROUTE_BUSINESS, ROUTE_INDEX } from '@/router';
import TopHeader from './TopHeader.vue';

const mountHeader = (routeName: string, path: string) =>
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
        $route: { name: routeName, matched: [{ path }], fullPath: path },
        $router: { push: vi.fn() },
        $store: {
          state: { site: { id: 'studio', title: 'Ace Data Cloud', features: {} } },
          getters: { authenticated: true, dark: true, user: { avatar: 'avatar.png' } },
          dispatch: vi.fn()
        }
      }
    }
  });

describe('TopHeader product home presentation mode', () => {
  it('renders only the centered brand logo on /home', () => {
    const wrapper = mountHeader(ROUTE_INDEX, '/home');

    expect(wrapper.classes()).toContain('minimal-only');
    expect(wrapper.findAll('.logo-stub')).toHaveLength(1);
    expect(wrapper.find('.menu-stub').exists()).toBe(false);
    expect(wrapper.find('.login-stub').exists()).toBe(false);
    expect(wrapper.find('.avatar').exists()).toBe(false);
    expect(wrapper.find('.console').exists()).toBe(false);
  });

  it('keeps the standard header on /business', () => {
    const wrapper = mountHeader(ROUTE_BUSINESS, '/business');

    expect(wrapper.classes()).not.toContain('minimal-only');
    expect(wrapper.find('.menu-stub').exists()).toBe(true);
  });
});
