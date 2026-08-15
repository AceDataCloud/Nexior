// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Main from './Main.vue';

const mountMain = (appName?: string) => {
  const dispatch = vi.fn();
  const wrapper = shallowMount(Main, {
    global: {
      stubs: {
        RouterView: { template: '<div class="route-content" />' },
        Navigator: { template: '<nav class="nav-stub" />' },
        ApplicationStatus: true,
        ApplicationConfirm: true
      },
      mocks: {
        $route: { meta: appName ? { appName } : {} },
        $store: {
          state: {
            token: {},
            applications: [],
            ...(appName ? { [appName]: { applications: [], status: {} } } : {})
          },
          getters: { user: {} },
          dispatch,
          commit: vi.fn()
        },
        $t: (key: string) => key
      }
    }
  });
  return { wrapper, dispatch };
};

describe('Main layout shell-only home', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders routed content and Navigator without application controls', async () => {
    const { wrapper } = mountMain();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.route-content').exists()).toBe(true);
    expect(wrapper.find('.nav-stub').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ApplicationStatus' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ApplicationConfirm' }).exists()).toBe(false);
    expect((wrapper.vm as any).initialized).toBe(true);
  });

  it('does not dispatch application actions or start a balance timer', async () => {
    const setInterval = vi.spyOn(window, 'setInterval');
    const { wrapper, dispatch } = mountMain();
    await wrapper.vm.$nextTick();

    expect(dispatch).not.toHaveBeenCalled();
    expect(setInterval).not.toHaveBeenCalled();
    expect((wrapper.vm as any).balanceTimer).toBe(0);
  });

  it('keeps service routes on the application initialization path', async () => {
    const { wrapper, dispatch } = mountMain('chat');
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).hasApplicationContext).toBe(true);
    expect(dispatch).not.toHaveBeenCalledWith('undefined/getApplications');
    expect((wrapper.vm as any).balanceTimer).not.toBe(0);
  });
});
