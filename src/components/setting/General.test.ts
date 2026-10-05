// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GeneralSetting from './General.vue';

const mountGeneral = (authenticated: boolean) =>
  shallowMount(GeneralSetting, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { getters: { authenticated } }
      }
    }
  });

describe('iOS account deletion in General Settings', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('shows the action only to signed-in iOS users', () => {
    vi.stubEnv('VITE_SURFACE', 'ios');
    expect(mountGeneral(true).find('.delete-account-action').exists()).toBe(true);
    expect(mountGeneral(false).find('.delete-account-action').exists()).toBe(false);

    vi.stubEnv('VITE_SURFACE', 'android');
    expect(mountGeneral(true).find('.delete-account-action').exists()).toBe(false);

    vi.stubEnv('VITE_SURFACE', 'web');
    expect(mountGeneral(true).find('.delete-account-action').exists()).toBe(false);
  });

  it('requests the existing deletion flow when tapped', async () => {
    vi.stubEnv('VITE_SURFACE', 'ios');
    const wrapper = mountGeneral(true);
    await wrapper.find('.delete-account-action').trigger('click');
    expect(wrapper.emitted('delete-account')).toHaveLength(1);
  });
});
