// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IKlingTask } from '@/models';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
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
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '' },
        $store: { state: { kling: {} } }
      }
    }
  });

describe('kling/task/Preview', () => {
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
