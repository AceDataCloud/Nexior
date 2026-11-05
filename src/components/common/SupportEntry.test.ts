// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SupportEntry from './SupportEntry.vue';

describe('floating support entry', () => {
  it('opens configured contacts directly and gates reporting behind login', async () => {
    const dispatch = vi.fn();
    const wrapper = mount(SupportEntry, {
      global: {
        stubs: {
          ElButton: { template: '<button><slot /></button>' },
          ElDialog: { props: ['modelValue'], template: '<div v-if="modelValue" role="dialog"><slot /></div>' }
        },
        mocks: {
          $t: (key: string) => key,
          $route: { path: '/chat', fullPath: '/chat', meta: { appName: 'chat' } },
          $store: {
            state: {
              site: {
                id: 'tenant',
                title: 'Tenant',
                branding: {
                  contacts: [
                    { type: 'wechat', qr: 'https://tenant.test/qr.png' },
                    { type: 'phone', value: '+86 123 456' }
                  ]
                }
              },
              setting: {}
            },
            getters: { authenticated: false },
            dispatch
          }
        }
      }
    });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    await wrapper.find('.support-launcher').trigger('click');
    expect(wrapper.find('img.contact-qr').attributes('src')).toBe('https://tenant.test/qr.png');
    expect(wrapper.find('a[href="tel:+86123456"]').exists()).toBe(true);
    await wrapper.findAll('.support-action').at(-1)!.trigger('click');
    expect(dispatch).toHaveBeenCalledWith('login', { redirect: '/chat' });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
