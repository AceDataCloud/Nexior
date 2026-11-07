// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ISeedanceTask, ISeedanceVideo } from '@/models';
import Preview from './Preview.vue';

vi.mock('@/components/common/ApiCodeButton.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/common/ReportButton.vue', () => ({ default: { template: '<div />' } }));

const videoUrl = 'https://example.com/result.mp4';
const lastFrameUrl = 'https://example.com/last-frame.jpg';

function renderVideo(data?: ISeedanceVideo) {
  const task: ISeedanceTask = {
    id: 'public-task',
    elapsed: 188.22,
    response: { success: true, task_id: 'public-task', data }
  };
  return shallowMount(Preview, {
    props: { modelValue: task },
    global: {
      mocks: { $t: (key: string) => key, $dayjs: { format: () => '2026-11-06' } },
      renderStubDefaultSlot: true,
      stubs: { CapabilityPresentation: true }
    }
  });
}

afterEach(() => vi.restoreAllMocks());

describe('Seedance task results', () => {
  it.each([
    { video_url: videoUrl, last_frame_url: lastFrameUrl },
    { content: { video_url: videoUrl, last_frame_url: lastFrameUrl } }
  ])('renders and downloads completed videos from either response shape', async (data) => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = renderVideo(data);

    expect(wrapper.getComponent({ name: 'VideoPlayer' }).props('src')).toBe(videoUrl);
    expect(wrapper.getComponent({ name: 'ImageWrapper' }).props('src')).toBe(lastFrameUrl);
    const download = wrapper
      .findAllComponents({ name: 'ElButton' })
      .find((button) => button.text().includes('seedance.button.download'));
    expect(download).toBeDefined();
    await download!.trigger('click');
    expect(open).toHaveBeenCalledWith(videoUrl, '_blank');
    wrapper.unmount();
  });

  it('prefers the standard URL when both fields exist', () => {
    const wrapper = renderVideo({
      video_url: videoUrl,
      content: { video_url: 'https://example.com/older.mp4' }
    });
    expect(wrapper.getComponent({ name: 'VideoPlayer' }).props('src')).toBe(videoUrl);
    wrapper.unmount();
  });

  it('handles a task without result data', () => {
    const wrapper = renderVideo();
    expect(wrapper.findComponent({ name: 'VideoPlayer' }).exists()).toBe(false);
    wrapper.unmount();
  });
});
