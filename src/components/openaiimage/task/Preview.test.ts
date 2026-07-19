// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { IOpenAIImageTask } from '@/models';

vi.mock('@/components/common/ImageWrapper.vue', () => ({
  default: { name: 'ImageWrapper', template: '<div />' }
}));

import Preview from './Preview.vue';

const mountPreview = (response?: IOpenAIImageTask['response']) =>
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
        ElAlert: { template: '<div><slot name="template" /><slot /></div>' }
      },
      mocks: {
        $t: (key: string) => key,
        $dayjs: { format: () => '2026-07-19' },
        $store: { state: { openaiimage: { config: {} } }, commit: () => undefined }
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
});
