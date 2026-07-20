// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Preview from './Preview.vue';

describe('flux/task/Preview', () => {
  it('labels tasks without a response as pending rather than failed', () => {
    const wrapper = shallowMount(Preview, {
      props: {
        modelValue: {
          id: 'task-1',
          request: { prompt: 'A lighthouse', model: 'flux-dev' }
        }
      },
      global: {
        stubs: {
          ElAlert: { template: '<div><slot name="template" /><slot /></div>' }
        },
        mocks: {
          $t: (key: string) => key,
          $dayjs: { format: () => '2026-07-19' }
        }
      }
    });

    expect(wrapper.text()).toContain('flux.status.pending');
    expect(wrapper.text()).not.toContain('flux.name.failure');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
  });
});
