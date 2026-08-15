// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { ROUTE_BUSINESS, ROUTE_CHATGPT_CONVERSATION_NEW, ROUTE_INDEX } from '@/router';
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

describe('TopHeader navigation', () => {
  it('keeps the standard header on /business', () => {
    const wrapper = mountHeader(ROUTE_BUSINESS, '/business');

    expect(wrapper.find('.menu-stub').exists()).toBe(true);
    expect(wrapper.findAll('.logo-stub')).toHaveLength(1);
  });

  it('routes overview and chat through their canonical route names', () => {
    const wrapper = mountHeader(ROUTE_BUSINESS, '/business');
    const vm = wrapper.vm as any;

    vm.onSelect('home');
    vm.onSelect('chatgpt');

    expect(vm.$router.push).toHaveBeenNthCalledWith(1, { name: ROUTE_INDEX });
    expect(vm.$router.push).toHaveBeenNthCalledWith(2, { name: ROUTE_CHATGPT_CONVERSATION_NEW });
  });
});
