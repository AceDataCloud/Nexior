// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { INanobananaTask } from '@/models';

vi.mock('@/components/common/ApiCodeButton.vue', () => ({
  default: { name: 'ApiCodeButton', template: '<div />' }
}));

import Preview from './Preview.vue';

const mountPreview = (response: INanobananaTask['response']) =>
  shallowMount(Preview, {
    props: {
      modelValue: {
        id: 'task-1',
        created_at: 1,
        request: { prompt: 'A lighthouse', model: 'nano-banana-pro' },
        response
      }
    },
    global: {
      stubs: {
        ElAlert: { template: '<div><slot name="template" /><slot /></div>' }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '2026-07-19' },
        $store: { state: { nanobanana: { config: {} } }, commit: () => undefined }
      }
    }
  });

describe('nanobanana/task/Preview', () => {
  it('shows task metadata before the first response arrives', () => {
    const wrapper = mountPreview(undefined);

    expect(wrapper.text()).toContain('nanobanana.status.pending');
    expect(wrapper.text()).toContain('nanobanana.name.model');
    expect(wrapper.text()).toContain('nanobanana.name.taskId');
    expect(wrapper.text()).toContain('task-1');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
  });

  it('labels an unfinished response as pending rather than failed', () => {
    const wrapper = mountPreview({ task_id: 'task-1' } as INanobananaTask['response']);

    expect(wrapper.text()).toContain('nanobanana.status.pending');
    expect(wrapper.text()).not.toContain('nanobanana.name.failure');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
  });

  it('keeps explicit failures on failure semantics', () => {
    const wrapper = mountPreview({
      success: false,
      task_id: 'task-1',
      error: { message: 'generation failed' }
    });

    expect(wrapper.text()).toContain('nanobanana.name.failure');
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
  });

  it('keeps error-only legacy responses on failure semantics', () => {
    const wrapper = mountPreview({
      task_id: 'task-1',
      error: { message: 'Provider rejected the task' }
    } as INanobananaTask['response']);

    expect(wrapper.text()).toContain('nanobanana.name.failure');
    expect(wrapper.text()).not.toContain('nanobanana.status.pending');
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
  });
});
