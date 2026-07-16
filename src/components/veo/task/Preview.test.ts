// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IVeoTask } from '@/models';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));

import TaskPreview from './Preview.vue';

const task: IVeoTask = {
  id: 'veo-task',
  trace_id: 'task-trace',
  created_at: 1,
  elapsed: 42.125,
  request: {
    action: 'image2video',
    model: 'veo31-fast',
    prompt: 'Walk toward the camera',
    image_urls: ['https://cdn.example.com/start.jpg', 'https://cdn.example.com/end.jpg'],
    aspect_ratio: '16:9',
    translation: true
  },
  response: {
    success: true,
    task_id: 'veo-task',
    trace_id: 'response-trace',
    data: [{ state: 'succeeded', video_url: 'https://cdn.example.com/result.mp4' }]
  }
};

const mountPreview = (modelValue = task) =>
  shallowMount(TaskPreview, {
    props: { modelValue },
    global: {
      stubs: {
        ElAlert: { template: '<div><slot /><slot name="template" /></div>' }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '' }
      }
    }
  });

describe('veo/task/Preview', () => {
  it('shows reference images and complete generation metadata', () => {
    const wrapper = mountPreview();

    expect(wrapper.findAllComponents({ name: 'ImagePreview' }).map((preview) => preview.props('url'))).toEqual([
      'https://cdn.example.com/start.jpg',
      'https://cdn.example.com/end.jpg'
    ]);
    expect(wrapper.text()).toContain('veo.name.action');
    expect(wrapper.text()).toContain('veo.button.action2');
    expect(wrapper.text()).toContain('16:9');
    expect(wrapper.text()).toContain('seedance.button.on');
    expect(wrapper.text()).toContain('veo-task');
    expect(wrapper.text()).toContain('42.13s');
    expect(wrapper.text()).toContain('response-trace');
  });

  it('infers image-to-video for legacy tasks with images but no action', () => {
    const legacyTask = {
      ...task,
      request: {
        ...task.request,
        action: undefined
      }
    };

    expect((mountPreview(legacyTask).vm as unknown as { actionLabel: string }).actionLabel).toBe('veo.button.action2');
  });

  it('infers ingredients mode for legacy tasks and ignores malformed image lists', () => {
    const ingredientsTask = {
      ...task,
      request: {
        ...task.request,
        action: undefined,
        model: 'veo31-fast-ingredients'
      }
    };
    expect((mountPreview(ingredientsTask).vm as unknown as { actionLabel: string }).actionLabel).toBe(
      'veo.button.actionIngredients'
    );

    const malformedTask = {
      ...task,
      request: {
        ...task.request,
        image_urls: 'https://cdn.example.com/not-an-array.jpg'
      }
    } as unknown as IVeoTask;
    expect(() => mountPreview(malformedTask)).not.toThrow();
  });
});
