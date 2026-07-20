// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IKlingTask } from '@/models';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));
vi.mock('@/components/common/ApiCodeButton.vue', () => ({
  default: { name: 'ApiCodeButton', template: '<div />' }
}));

import TaskPreview from './Preview.vue';

const task: IKlingTask = {
  id: 'kling-task',
  created_at: 1,
  request: {
    prompt: 'Restyle the scene',
    start_image_url: 'https://cdn.example.com/start.jpg',
    end_image_url: 'https://cdn.example.com/end.jpg',
    image_url: 'https://cdn.example.com/character.jpg',
    video_url: 'https://cdn.example.com/motion.mp4',
    video_list: [
      { video_url: 'https://cdn.example.com/reference-1.mp4' },
      { video_url: 'https://cdn.example.com/reference-2.mp4' }
    ],
    audio_url: 'https://cdn.example.com/speech.mp3'
  },
  response: {
    success: true,
    task_id: 'kling-task'
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
        $dayjs: { format: () => '' },
        $store: { state: { kling: {} } }
      }
    }
  });

describe('kling/task/Preview', () => {
  it('shows pending copy and a time icon before a response exists', () => {
    const wrapper = mountPreview({
      ...task,
      response: undefined
    });

    expect(wrapper.find('.prompt').text()).toContain('kling.status.pending');
    expect(wrapper.text()).toContain('kling.status.pending');
    expect(wrapper.text()).not.toContain('kling.name.failure');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
  });

  it.each(['pending', 'processing', undefined])(
    'shows processing copy for an unfinished response with state %s',
    (state) => {
      const wrapper = mountPreview({
        ...task,
        response: {
          task_id: 'kling-task',
          state
        } as IKlingTask['response']
      });

      expect(wrapper.find('.prompt').text()).toContain('kling.status.processing');
      expect(wrapper.text()).toContain('kling.status.processing');
      expect(wrapper.text()).not.toContain('kling.status.pending');
      expect(wrapper.text()).not.toContain('kling.name.failure');
      expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(false);
    }
  );

  it('preserves explicit failure copy and warning icon', () => {
    const wrapper = mountPreview({
      ...task,
      response: {
        success: false,
        task_id: 'kling-task',
        error: { message: 'Generation failed' }
      }
    });

    expect(wrapper.text()).toContain('kling.name.failure');
    expect(wrapper.text()).not.toContain('kling.status.pending');
    expect(wrapper.text()).not.toContain('kling.status.processing');
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
  });

  it.each([
    { state: 'failed', error: { message: 'Generation failed' } },
    { error: { message: 'Provider rejected the task' } }
  ])('keeps legacy terminal responses on failure semantics', (response) => {
    const wrapper = mountPreview({
      ...task,
      response: { task_id: 'kling-task', ...response } as IKlingTask['response']
    });

    expect(wrapper.text()).toContain('kling.name.failure');
    expect(wrapper.text()).not.toContain('kling.status.processing');
    expect(wrapper.findComponent({ name: 'WarningIcon' }).exists()).toBe(true);
  });

  it('gives failure semantics priority over a contradictory success flag', () => {
    const wrapper = mountPreview({
      ...task,
      response: {
        success: true,
        task_id: 'kling-task',
        video_url: 'https://cdn.example.com/result.mp4',
        error: { message: 'Provider marked the task failed' }
      }
    });

    expect(wrapper.text()).toContain('kling.name.failure');
    expect(wrapper.find('.success').exists()).toBe(false);
  });

  it('shows every previewable request input before the prompt', () => {
    const wrapper = mountPreview();

    expect(wrapper.findAllComponents({ name: 'ImagePreview' }).map((preview) => preview.props('url'))).toEqual([
      'https://cdn.example.com/start.jpg',
      'https://cdn.example.com/end.jpg',
      'https://cdn.example.com/character.jpg'
    ]);
    expect(wrapper.findAllComponents({ name: 'VideoPreview' }).map((preview) => preview.props('url'))).toEqual([
      'https://cdn.example.com/motion.mp4',
      'https://cdn.example.com/reference-1.mp4',
      'https://cdn.example.com/reference-2.mp4'
    ]);
    expect(wrapper.findComponent({ name: 'AudioPreview' }).props('url')).toBe('https://cdn.example.com/speech.mp3');

    const media = wrapper.find('.info > div').element;
    const prompt = wrapper.find('.prompt').element;
    expect(media.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it.each([{ video_url: 'https://cdn.example.com/not-an-array.mp4' }, [null]])(
    'ignores a malformed video list from stored task data',
    (videoList) => {
      const malformedTask = {
        ...task,
        request: {
          ...task.request,
          video_list: videoList
        }
      } as unknown as IKlingTask;

      expect(() => mountPreview(malformedTask)).not.toThrow();
    }
  );
});
