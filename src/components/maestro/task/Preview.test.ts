// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICredential, IMaestroTask } from '@/models';

const maestroOperatorMock = vi.hoisted(() => ({
  task: vi.fn()
}));

vi.mock('@/operators', () => ({
  maestroOperator: maestroOperatorMock
}));

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { name: 'VideoPlayer', template: '<div />' }
}));

import TaskPreview from './Preview.vue';
import { clearMaestroReferenceTaskCache } from './referenceTask';

const sourceTask: IMaestroTask = {
  id: 'source-task',
  status: 'succeeded',
  response: {
    success: true,
    task_id: 'source-task',
    data: {
      variants: [{ lang: 'zh', output_url: 'https://cdn.example.com/source-video.mp4' }]
    }
  }
};

const remixTask: IMaestroTask = {
  id: 'remix-task',
  status: 'succeeded',
  request: {
    action: 'remix',
    ref_task_id: sourceTask.id,
    prompt: 'Make the background music quieter'
  },
  response: {
    success: true,
    task_id: 'remix-task',
    data: { variants: [] }
  }
};

const createMaestroState = (items: IMaestroTask[], credential?: ICredential) =>
  reactive({
    credential,
    tasks: { items }
  });

const mountPreview = (
  items: IMaestroTask[],
  state = createMaestroState(items, { id: 'credential-1', token: 'test-token' }),
  modelValue = remixTask
) =>
  shallowMount(TaskPreview, {
    props: { modelValue },
    global: {
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '' },
        $store: {
          state: {
            maestro: state
          }
        }
      }
    }
  });

const expectReferenceBeforePrompt = (wrapper: ReturnType<typeof mountPreview>, selector = 'video-preview-stub') => {
  const reference = wrapper.find(selector).element;
  const prompt = wrapper.find('.prompt').element;
  expect(reference.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
};

describe('maestro/task/Preview', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    clearMaestroReferenceTaskCache();
  });

  it('shows the referenced task output for a remix in the current history', () => {
    const wrapper = mountPreview([sourceTask, remixTask]);

    expect((wrapper.vm as unknown as { files: unknown[] }).files).toEqual([
      {
        url: 'https://cdn.example.com/source-video.mp4',
        name: 'source-video.mp4',
        kind: 'video'
      }
    ]);
    expect(wrapper.findComponent({ name: 'VideoPreview' }).props('url')).toBe(
      'https://cdn.example.com/source-video.mp4'
    );
    expectReferenceBeforePrompt(wrapper);
    expect(maestroOperatorMock.task).not.toHaveBeenCalled();
  });

  it('loads the referenced task by id when it is outside the current history page', async () => {
    maestroOperatorMock.task.mockResolvedValueOnce({ data: sourceTask });
    const wrapper = mountPreview([remixTask]);

    await flushPromises();

    expect(maestroOperatorMock.task).toHaveBeenCalledWith(
      sourceTask.id,
      expect.objectContaining({ token: 'test-token' })
    );
    expect((wrapper.vm as unknown as { files: unknown[] }).files).toEqual([
      {
        url: 'https://cdn.example.com/source-video.mp4',
        name: 'source-video.mp4',
        kind: 'video'
      }
    ]);
    expect(wrapper.findComponent({ name: 'VideoPreview' }).props('url')).toBe(
      'https://cdn.example.com/source-video.mp4'
    );
    expectReferenceBeforePrompt(wrapper);
  });

  it('loads the reference when credentials arrive after the card mounts', async () => {
    maestroOperatorMock.task.mockResolvedValueOnce({ data: sourceTask });
    const state = createMaestroState([remixTask]);
    const wrapper = mountPreview([remixTask], state);

    await flushPromises();
    expect(maestroOperatorMock.task).not.toHaveBeenCalled();

    state.credential = { id: 'credential-1', token: 'late-token' };
    await flushPromises();

    expect(maestroOperatorMock.task).toHaveBeenCalledWith(
      sourceTask.id,
      expect.objectContaining({ token: 'late-token' })
    );
    expect(wrapper.findComponent({ name: 'VideoPreview' }).exists()).toBe(true);
  });

  it('ignores a stale response after the credential changes', async () => {
    let resolveFirst: ((value: { data: IMaestroTask }) => void) | undefined;
    maestroOperatorMock.task
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce({
        data: {
          ...sourceTask,
          response: {
            ...sourceTask.response!,
            data: { variants: [{ output_url: 'https://cdn.example.com/new-credential.mp4' }] }
          }
        }
      });
    const state = createMaestroState([remixTask], { id: 'credential-1', token: 'old-token' });
    const wrapper = mountPreview([remixTask], state);
    await flushPromises();

    state.credential = { id: 'credential-2', token: 'new-token' };
    await flushPromises();
    resolveFirst?.({ data: sourceTask });
    await flushPromises();

    expect(wrapper.findComponent({ name: 'VideoPreview' }).props('url')).toBe(
      'https://cdn.example.com/new-credential.mp4'
    );
  });

  it('surfaces exhausted retries and lets the user retry manually', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    maestroOperatorMock.task.mockRejectedValue(new Error('temporary outage'));
    const mixedRemixTask: IMaestroTask = {
      ...remixTask,
      request: {
        ...remixTask.request,
        file_urls: ['https://cdn.example.com/uploaded-reference.jpg']
      }
    };
    const state = createMaestroState([mixedRemixTask], { id: 'credential-1', token: 'test-token' });
    const wrapper = mountPreview([mixedRemixTask], state, mixedRemixTask);

    await vi.runAllTimersAsync();
    await flushPromises();

    expect(maestroOperatorMock.task).toHaveBeenCalledTimes(3);
    expect(wrapper.findComponent({ name: 'ImagePreview' }).exists()).toBe(true);
    expect(wrapper.find('.reference-load-failed').exists()).toBe(true);
    expectReferenceBeforePrompt(wrapper, '.reference-load-failed');

    maestroOperatorMock.task.mockReset().mockResolvedValueOnce({ data: sourceTask });
    await wrapper.find('.reference-retry').trigger('click');
    await flushPromises();

    expect(wrapper.find('.reference-load-failed').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'VideoPreview' }).exists()).toBe(true);
  });
});
