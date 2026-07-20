// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IHailuoTask } from '@/models';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));

import TaskPreview from './Preview.vue';

const task: IHailuoTask = {
  id: 'hailuo-task',
  created_at: 1,
  request: {
    prompt: 'A paper boat crossing a moonlit lake',
    model: 'MiniMax-Hailuo-02'
  }
};

const mountPreview = (modelValue: IHailuoTask) =>
  shallowMount(TaskPreview, {
    props: { modelValue },
    global: {
      stubs: {
        ElAlert: { template: '<div><div class="alert-template"><slot name="template" /></div><slot /></div>' }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '2026-07-19' },
        $store: { state: { hailuo: {} } }
      }
    }
  });

describe('hailuo/task/Preview', () => {
  it('shows pending copy and a time icon before a response exists', () => {
    const wrapper = mountPreview(task);

    expect(wrapper.find('.alert-template').text()).toContain('hailuo.status.pending');
    expect(wrapper.find('.prompt').text()).toContain('hailuo.status.pending');
    expect(wrapper.text()).not.toContain('hailuo.name.failure');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
  });

  it.each(['pending', 'processing', 'running'])('shows processing copy for a video in the %s state', (state) => {
    const wrapper = mountPreview({
      ...task,
      response: {
        data: [{ state }]
      } as IHailuoTask['response']
    });

    expect(wrapper.find('.alert-template').text()).toContain('hailuo.status.processing');
    expect(wrapper.find('.prompt').text()).toContain('hailuo.status.processing');
    expect(wrapper.text()).not.toContain('hailuo.status.pending');
    expect(wrapper.text()).not.toContain('hailuo.name.failure');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
    expect(wrapper.find('.success').exists()).toBe(false);
  });

  it('does not render success metadata while a successful response is still processing', () => {
    const wrapper = mountPreview({
      ...task,
      response: { success: true, data: [{ state: 'processing' }] } as IHailuoTask['response']
    });

    expect(wrapper.find('.alert-template').text()).toContain('hailuo.status.processing');
    expect(wrapper.find('.success').exists()).toBe(false);
  });

  it('preserves explicit failure copy and warning icon', () => {
    const wrapper = mountPreview({
      ...task,
      response: {
        success: false,
        error: { message: 'Generation failed' }
      } as IHailuoTask['response']
    });

    expect(wrapper.find('.alert-template').text()).toContain('hailuo.name.failure');
    expect(wrapper.text()).not.toContain('hailuo.status.pending');
    expect(wrapper.text()).not.toContain('hailuo.status.processing');
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
  });

  it('gives failure semantics priority over stale processing data', () => {
    const wrapper = mountPreview({
      ...task,
      response: {
        success: false,
        error: { message: 'Generation failed' },
        data: [{ state: 'processing' }]
      } as IHailuoTask['response']
    });

    expect(wrapper.text()).toContain('hailuo.name.failure');
    expect(wrapper.text()).not.toContain('hailuo.status.processing');
  });

  it('gives error semantics priority over a contradictory success flag', () => {
    const wrapper = mountPreview({
      ...task,
      response: {
        success: true,
        error: { message: 'Provider marked the task failed' }
      } as IHailuoTask['response']
    });

    expect(wrapper.text()).toContain('hailuo.name.failure');
    expect(wrapper.find('.success').exists()).toBe(false);
  });

  it('shows queued responses as processing', () => {
    const wrapper = mountPreview({
      ...task,
      response: { success: true, data: [{ state: 'queued' }] } as IHailuoTask['response']
    });

    expect(wrapper.text()).toContain('hailuo.status.processing');
    expect(wrapper.find('.success').exists()).toBe(false);
  });

  it.each(['failed', 'cancelled'])('keeps a %s provider state on failure semantics', (state) => {
    const wrapper = mountPreview({
      ...task,
      response: { success: true, data: [{ state }] } as IHailuoTask['response']
    });

    expect(wrapper.text()).toContain('hailuo.name.failure');
    expect(wrapper.text()).not.toContain('hailuo.status.processing');
    expect(wrapper.find('.success').exists()).toBe(false);
  });
});
