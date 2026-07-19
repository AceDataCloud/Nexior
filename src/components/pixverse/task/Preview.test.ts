// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { ElAlert } from 'element-plus';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));

import Preview from './Preview.vue';

describe('pixverse/task/Preview', () => {
  it('renders failed tasks with failure semantics', () => {
    const wrapper = shallowMount(Preview, {
      props: {
        modelValue: {
          id: 'task-1',
          request: { prompt: 'A lighthouse', model: 'pixverse-v4.5' },
          response: {
            success: false,
            task_id: 'task-1',
            error: { message: 'generation failed' },
            trace_id: 'trace-1'
          }
        }
      },
      global: {
        mocks: {
          $t: (key: string) => key,
          $dayjs: { format: () => '2026-07-19' }
        }
      }
    });

    const alert = wrapper.findComponent(ElAlert);
    expect(alert.classes()).toContain('failure');
    expect(alert.classes()).not.toContain('info');
  });
});
