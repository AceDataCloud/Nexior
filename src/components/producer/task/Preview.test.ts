// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { ElAlert } from 'element-plus';
import { describe, expect, it } from 'vitest';
import type { IProducerTask } from '@/models';
import Preview from './Preview.vue';

const mountTask = (modelValue: IProducerTask) =>
  mount(Preview, {
    props: { modelValue },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: {
            producer: {
              audio: {},
              config: {},
              status: {},
              tasks: {}
            }
          },
          dispatch: () => undefined,
          commit: () => undefined
        }
      },
      stubs: {
        ApiCodeDialog: true,
        ElDropdown: true,
        ElTooltip: true
      }
    }
  });

describe('producer/task/Preview', () => {
  it('renders a task-level failure when no audio rows exist', () => {
    const wrapper = mountTask({
      id: 'task-1',
      map: () => [],
      response: {
        success: false,
        task_id: 'task-1',
        data: [],
        error: { message: 'generation rejected' },
        trace_id: 'trace-1'
      }
    });

    const alert = wrapper.findComponent(ElAlert);
    expect(alert.classes()).toContain('task-failure');
    expect(wrapper.text()).toContain('producer.name.failure');
    expect(wrapper.text()).toContain('generation rejected');
    expect(wrapper.text()).toContain('trace-1');
    expect(wrapper.findAll('.audio')).toHaveLength(0);
  });

  it('renders error-only task responses as failures', () => {
    const wrapper = mountTask({
      id: 'task-2',
      map: () => [],
      trace_id: 'trace-2',
      response: { error: 'provider timeout' }
    });

    expect(wrapper.findComponent(ElAlert).classes()).toContain('task-failure');
    expect(wrapper.text()).toContain('provider timeout');
    expect(wrapper.text()).toContain('trace-2');
  });

  it('keeps empty successful responses out of failure state', () => {
    const wrapper = mountTask({
      id: 'task-3',
      map: () => [],
      response: { success: true, task_id: 'task-3', data: [] }
    });

    expect(wrapper.findComponent(ElAlert).exists()).toBe(false);
  });

  it('keeps playable partial results instead of showing a task-level failure', () => {
    const wrapper = mountTask({
      id: 'task-4',
      map: () => [],
      response: {
        success: false,
        task_id: 'task-4',
        data: [{ id: 'audio-1', audio_url: 'https://cdn.example.com/audio.mp3' }],
        error: { message: 'second variation failed' }
      }
    });

    expect(wrapper.findComponent(ElAlert).exists()).toBe(false);
    expect(wrapper.findAll('.audio')).toHaveLength(1);
  });
});
