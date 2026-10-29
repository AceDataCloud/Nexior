// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { IOpenAIImageTask } from '@/models';

vi.mock('@/components/common/ImageWrapper.vue', () => ({
  default: { name: 'ImageWrapper', template: '<div />' }
}));

const confirm = vi.fn();
const task = vi.fn();
vi.mock('@/operators/openaiimage', () => ({ openaiimageOperator: { task: (...args: unknown[]) => task(...args) } }));
let observerCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
const disconnect = vi.fn();

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessageBox: { confirm: (...args: unknown[]) => confirm(...args) },
    ElMessage: { success: vi.fn(), error: vi.fn() }
  };
});

import Preview from './Preview.vue';

const mountPreview = (response?: IOpenAIImageTask['response'], dispatch = vi.fn()) =>
  shallowMount(Preview, {
    props: {
      modelValue: {
        id: 'task-1',
        request: { prompt: 'A lighthouse', model: 'gpt-image-1', size: '1024x1024' },
        ...(response === undefined ? {} : { response })
      }
    },
    global: {
      stubs: {
        ElAlert: { template: '<div><slot name="template" /><slot /></div>' },
        ElTooltip: { template: '<div><slot /></div>' }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '2026-07-19' },
        $store: { state: { openaiimage: { config: {} } }, commit: () => undefined, dispatch }
      }
    }
  });

describe('openaiimage/task/Preview', () => {
  beforeEach(() => {
    task.mockReset();
    disconnect.mockReset();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof observerCallback) {
          observerCallback = callback;
        }
        observe() {}
        disconnect() {
          disconnect();
        }
      }
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('labels tasks without a response as pending', () => {
    const wrapper = mountPreview();

    expect(wrapper.text()).toContain('openaiimage.status.pending');
    expect(wrapper.text()).not.toContain('openaiimage.name.failure');
    expect(wrapper.findComponent({ name: 'TimeIcon' }).exists()).toBe(true);
  });

  it('labels responses without an outcome as status', () => {
    const wrapper = mountPreview({ task_id: 'task-1' } as IOpenAIImageTask['response']);

    expect(wrapper.text()).toContain('openaiimage.name.status');
    expect(wrapper.text()).not.toContain('openaiimage.name.failure');
    expect(wrapper.findComponent({ name: 'InfoIcon' }).exists()).toBe(true);
  });

  it('renders a delete button on every status (incl. pending)', () => {
    const wrapper = mountPreview();
    expect(wrapper.find('.btn-delete').exists()).toBe(true);
  });

  it('dispatches deleteTask after the user confirms', async () => {
    confirm.mockResolvedValueOnce(undefined);
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountPreview(undefined, dispatch);

    await wrapper.find('.btn-delete').trigger('click');
    await Promise.resolve();

    expect(confirm).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith('openaiimage/deleteTask', { id: 'task-1' });
  });

  it('does NOT dispatch when the user cancels the confirm dialog', async () => {
    confirm.mockRejectedValueOnce(new Error('cancel'));
    const dispatch = vi.fn();
    const wrapper = mountPreview(undefined, dispatch);

    await wrapper.find('.btn-delete').trigger('click');
    await Promise.resolve();

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('summary detail hydration', () => {
  const mountSummary = (store?: any) =>
    shallowMount(Preview, {
      props: {
        modelValue: {
          id: 'task-1',
          summary: true,
          type: 'images',
          request: { prompt: 'A lighthouse' },
          response: { success: true, task_id: 'task-1' }
        }
      },
      global: {
        stubs: {
          ElAlert: { template: '<div><slot name="template" /><slot /></div>' },
          ElTooltip: { template: '<div><slot /></div>' }
        },
        mocks: {
          $t: (key: string) => key,
          $dayjs: { format: () => '2026-07-19' },
          $store: store || {
            state: { openaiimage: { credential: { token: 'test-token' }, config: {} } },
            commit: vi.fn()
          }
        }
      }
    });

  beforeEach(() => {
    task.mockReset();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof observerCallback) {
          observerCallback = callback;
        }
        observe() {}
        disconnect() {
          disconnect();
        }
      }
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fetches only when visible and retains detail through summary refresh', async () => {
    task.mockResolvedValue({
      data: {
        id: 'task-1',
        response: { success: true, task_id: 'task-1', data: [{ b64_json: 'abc' }] },
        request: { prompt: 'A lighthouse' }
      }
    });
    const wrapper = mountSummary();
    expect(task).not.toHaveBeenCalled();
    observerCallback?.([{ isIntersecting: true }]);
    await vi.waitFor(() => expect(wrapper.vm.detail?.id).toBe('task-1'));
    expect(task).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.images[0].url).toBe('data:image/png;base64,abc');
    await wrapper.setProps({
      modelValue: { id: 'task-1', summary: true, response: { success: true, task_id: 'task-1' } }
    });
    expect(wrapper.vm.images[0].url).toBe('data:image/png;base64,abc');
    expect(task).toHaveBeenCalledTimes(1);
    observerCallback?.([{ isIntersecting: false }]);
    expect(wrapper.vm.detail).toBeUndefined();
    wrapper.unmount();
  });

  it('waits for an edit task to finish before loading its reference images', async () => {
    const wrapper = mountSummary();
    await wrapper.setProps({
      modelValue: {
        id: 'task-1',
        summary: true,
        type: 'images_edits',
        request: { prompt: 'edit' },
        response: { task_id: 'task-1' }
      }
    });
    observerCallback?.([{ isIntersecting: true }]);
    expect(task).not.toHaveBeenCalled();
    task.mockResolvedValue({
      data: {
        id: 'task-1',
        response: { success: false, task_id: 'task-1' },
        request: { image_urls: ['https://example.com/reference.png'] }
      }
    });
    await wrapper.setProps({
      modelValue: {
        id: 'task-1',
        summary: true,
        type: 'images_edits',
        finished_at: 100,
        request: { prompt: 'edit' },
        response: { success: false, task_id: 'task-1' }
      }
    });
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(1));
    wrapper.unmount();
  });

  it('does not automatically retry a failed detail request', async () => {
    task
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce({ data: { id: 'task-1', response: { success: true, task_id: 'task-1' } } });
    const wrapper = mountSummary();
    observerCallback?.([{ isIntersecting: true }]);
    await vi.waitFor(() => expect(wrapper.vm.detailError).toBe(true));
    await wrapper.setProps({
      modelValue: { id: 'task-1', summary: true, response: { success: true, task_id: 'task-1' } }
    });
    expect(task).toHaveBeenCalledTimes(1);
    wrapper.vm.retryDetail();
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(2));
    wrapper.unmount();
  });
});
