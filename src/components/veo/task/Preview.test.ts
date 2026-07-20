// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IVeoTask } from '@/models';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', props: ['src'], template: '<div />' }
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
        ElAlert: {
          name: 'ElAlert',
          template: '<div><div class="alert-template"><slot name="template" /></div><slot /></div>'
        }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '' }
      }
    }
  });

describe('veo/task/Preview', () => {
  it('shows a successful video with complete metadata and prefers the response trace ID', () => {
    const wrapper = mountPreview();

    expect(wrapper.find('.task-metadata').classes()).toContain('success');
    expect(wrapper.findComponent({ name: 'VideoPlayer' }).props('src')).toBe('https://cdn.example.com/result.mp4');
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
    expect(wrapper.text()).not.toContain('task-trace');
  });

  it('shows pending metadata before a response and falls back to the task trace ID', () => {
    const pendingTask: IVeoTask = {
      ...task,
      response: undefined,
      request: {
        ...task.request,
        action: undefined
      }
    };
    const wrapper = mountPreview(pendingTask);

    expect(wrapper.find('.task-metadata').classes()).toContain('info');
    expect(wrapper.find('.failure').exists()).toBe(false);
    expect(wrapper.text()).toContain('veo.status.pending');
    expect(wrapper.text()).toContain('task-trace');
    expect(wrapper.text()).toContain('veo.button.action2');
  });

  it('shows an explicit failure reason and failure metadata with the task trace fallback', () => {
    const failedTask: IVeoTask = {
      ...task,
      response: {
        success: false,
        task_id: 'veo-task',
        error: {
          code: 'CONTENT_REJECTED',
          message: 'The request could not be processed'
        }
      }
    };
    const wrapper = mountPreview(failedTask);

    expect(wrapper.find('.failure .alert-template').text()).toContain('veo.name.failure');
    expect(wrapper.find('.failure').text()).toContain('veo.name.failureReason');
    expect(wrapper.find('.failure').text()).toContain('The request could not be processed');
    expect(wrapper.find('.task-metadata').classes()).toContain('failure');
    expect(wrapper.findComponent({ name: 'VideoPlayer' }).exists()).toBe(false);
    expect(wrapper.text()).toContain('task-trace');
  });

  it('keeps the task ID as the final metadata row when no trace or elapsed time exists', () => {
    const taskWithoutTrace: IVeoTask = {
      id: 'pending-without-trace',
      created_at: 1,
      request: {
        model: 'veo31-fast'
      }
    };
    const wrapper = mountPreview(taskWithoutTrace);
    const metadataRows = wrapper.find('.task-metadata').findAll('p');

    expect(metadataRows.at(-1)?.text()).toContain('pending-without-trace');
    expect(wrapper.text()).not.toContain('veo.name.traceId');
  });

  it.each([
    ['text-to-video', { model: 'veo31-fast' }, 'veo.button.action1'],
    [
      'image-to-video',
      { model: 'veo31-fast', image_urls: ['https://cdn.example.com/start.jpg'] },
      'veo.button.action2'
    ],
    [
      'ingredients-to-video from its legacy model',
      {
        model: 'veo31-fast-ingredients',
        image_urls: ['https://cdn.example.com/subject.jpg']
      },
      'veo.button.actionIngredients'
    ],
    [
      'ingredients-to-video from three references',
      {
        model: 'veo31-fast',
        image_urls: ['subject.jpg', 'style.jpg', 'scene.jpg']
      },
      'veo.button.actionIngredients'
    ]
  ])('infers %s for legacy tasks without an action', (_name, request, expectedLabel) => {
    const legacyTask: IVeoTask = {
      ...task,
      request
    };

    expect((mountPreview(legacyTask).vm as unknown as { actionLabel: string }).actionLabel).toBe(expectedLabel);
  });

  it('ignores malformed legacy image lists', () => {
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
