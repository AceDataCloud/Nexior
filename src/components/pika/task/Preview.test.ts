// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IPikaTask } from '@/models';

vi.mock('../VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));
vi.mock('@/components/common/ApiCodeButton.vue', () => ({
  default: { name: 'ApiCodeButton', template: '<button />' }
}));

import TaskPreview from './Preview.vue';

const baseTask = {
  id: 'pika-task',
  created_at: 1,
  request: { prompt: 'A paper boat crossing the ocean' }
} as IPikaTask;

const mountPreview = (modelValue: IPikaTask) =>
  shallowMount(TaskPreview, {
    props: { modelValue },
    global: {
      stubs: {
        ElAlert: { template: '<div><slot /><slot name="template" /></div>' }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '' },
        $store: { state: { pika: {} } }
      }
    }
  });

describe('pika/task/Preview waiting states', () => {
  it.each([
    {
      name: 'pending without a response',
      task: baseTask,
      status: 'pika.status.pending'
    },
    {
      name: 'pending unfinished response',
      task: {
        ...baseTask,
        response: { success: true, data: [{ state: 'pending' }] }
      } as IPikaTask,
      status: 'pika.status.processing'
    },
    {
      name: 'processing unfinished response',
      task: {
        ...baseTask,
        response: { success: true, data: [{ state: 'processing' }] }
      } as IPikaTask,
      status: 'pika.status.processing'
    },
    {
      name: 'unfinished response before video data arrives',
      task: {
        ...baseTask,
        response: { task_id: 'pika-task' }
      } as IPikaTask,
      status: 'pika.status.processing'
    }
  ])('shows TimeIcon and matching copy for $name', ({ task, status }) => {
    const wrapper = mountPreview(task);

    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
    expect(wrapper.text().match(new RegExp(status, 'g'))).toHaveLength(2);
    expect(wrapper.text()).not.toContain('pika.name.failure');
    expect(wrapper.find('.success').exists()).toBe(false);
  });

  it('preserves explicit failure semantics', () => {
    const wrapper = mountPreview({
      ...baseTask,
      response: {
        success: false,
        data: [{ state: 'pending' }],
        error: { message: 'generation failed' },
        trace_id: 'trace-1'
      }
    } as IPikaTask);

    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(false);
    expect(wrapper.text()).toContain('pika.name.failure');
    expect(wrapper.text()).not.toContain('pika.status.pending');
    expect(wrapper.text()).not.toContain('pika.status.processing');
  });

  it.each([
    { success: true, data: [{ state: 'failed' }] },
    { error: { message: 'Provider rejected the task' }, data: [] }
  ])('keeps terminal legacy responses on failure semantics', (response) => {
    const wrapper = mountPreview({ ...baseTask, response } as IPikaTask);

    expect(wrapper.text()).toContain('pika.name.failure');
    expect(wrapper.text()).not.toContain('pika.status.processing');
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
  });
});
