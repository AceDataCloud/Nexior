// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { ElAlert } from 'element-plus';
import { describe, expect, it } from 'vitest';
import type { IFishTask } from '@/models';
import Preview from './Preview.vue';

const mountTask = (modelValue: IFishTask) =>
  mount(Preview, {
    props: { modelValue },
    global: {
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '2026-07-19' }
      },
      stubs: {
        'capability-presentation': true
      }
    }
  });

describe('fish/task/Preview', () => {
  it('renders explicit failures with reason and trace metadata', () => {
    const wrapper = mountTask({
      id: 'task-1',
      request: { text: 'Hello' },
      response: {
        success: false,
        error: { message: 'voice unavailable' },
        trace_id: 'trace-1'
      }
    });

    const alert = wrapper.findComponent(ElAlert);
    expect(alert.classes()).toContain('failure');
    expect(wrapper.text()).toContain('fish.name.failure');
    expect(wrapper.text()).toContain('voice unavailable');
    expect(wrapper.text()).toContain('trace-1');
  });

  it('keeps tasks without a response in the pending info state', () => {
    const wrapper = mountTask({
      id: 'task-2',
      request: { text: 'Hello' }
    });

    const alert = wrapper.findComponent(ElAlert);
    expect(alert.classes()).toContain('info');
    expect(alert.classes()).not.toContain('failure');
    expect(wrapper.text()).toContain('fish.status.pending');
  });

  it('treats error-only responses as failures', () => {
    const wrapper = mountTask({
      id: 'task-3',
      response: {
        error: 'upstream timeout',
        trace_id: 'trace-3'
      }
    });

    const alert = wrapper.findComponent(ElAlert);
    expect(alert.classes()).toContain('failure');
    expect(wrapper.text()).toContain('fish.name.failure');
    expect(wrapper.text()).toContain('upstream timeout');
  });
});
