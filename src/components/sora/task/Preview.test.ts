// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));

import Preview from './Preview.vue';

describe('sora/task/Preview', () => {
  it.each([
    ['without a response', undefined, 'sora.status.pending'],
    ['with a pending response', 'pending', 'sora.status.processing'],
    ['with a processing response', 'processing', 'sora.status.processing']
  ])('labels tasks %s with waiting semantics', (_name, state, expectedStatus) => {
    const wrapper = shallowMount(Preview, {
      props: {
        modelValue: {
          id: 'task-1',
          request: { prompt: 'A lighthouse', model: 'sora-2' },
          response: state ? ({ data: [{ state }] } as any) : undefined
        }
      },
      global: {
        stubs: {
          ElAlert: { template: '<div><div class="alert-template"><slot name="template" /></div><slot /></div>' }
        },
        mocks: {
          $t: (key: string) => key,
          $dayjs: { format: () => '2026-07-19' }
        }
      }
    });

    expect(wrapper.find('.alert-template').text()).toContain(expectedStatus);
    expect(wrapper.find('.alert-template').text()).not.toContain('sora.name.failure');
    expect(wrapper.find('.prompt').text()).toContain(expectedStatus);
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
  });
});
