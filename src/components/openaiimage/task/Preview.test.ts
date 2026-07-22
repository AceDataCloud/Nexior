// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IOpenAIImageTask } from '@/models';

vi.mock('@/components/common/ImageWrapper.vue', () => ({
  default: { name: 'ImageWrapper', template: '<div />' }
}));

const confirm = vi.fn();
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
