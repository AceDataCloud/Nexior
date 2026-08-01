// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

// The card embeds a video player whose module reads window.matchMedia at import.
vi.mock('@/components/common/VideoPlayer.vue', () => ({ default: { name: 'VideoPlayer', render: () => null } }));
vi.mock('@/components/common/VideoPreview.vue', () => ({
  default: { name: 'VideoPreview', props: ['url', 'name'], render: () => null }
}));

import Preview from './Preview.vue';
import { IDigitalHumanTask } from '@/models';

const mountCard = (task: Partial<IDigitalHumanTask>) =>
  mount(Preview, {
    props: { modelValue: task as IDigitalHumanTask },
    global: {
      stubs: { ApiCodeButton: true, ReportButton: true, CapabilityPresentation: true, CopyToClipboard: true },
      mocks: {
        $t: (key: string, args?: Record<string, unknown>) => (args ? `${key}:${JSON.stringify(args)}` : key),
        $dayjs: { format: () => '2026-08-01' },
        $store: { state: { digitalhuman: {} } }
      }
    }
  });

const succeeded = (extra = {}): Partial<IDigitalHumanTask> => ({
  id: 'task_1',
  status: 'succeed',
  created_at: 1_700_000_000,
  elapsed: 2502,
  request: { video_url: 'https://cdn.acedata.cloud/face.mp4', text: 'hello' },
  response: {
    success: true,
    task_id: 'task_1',
    video_url: 'https://cdn.acedata.cloud/out.mp4',
    duration: 17.2,
    width: 1280,
    height: 720,
    trace_id: 'trace-abc',
    ...extra
  }
});

describe('digitalhuman/task/Preview', () => {
  // The engine was a half-price billing tier that never changed the output;
  // naming it on a card only ever confused people.
  it('never names a lip-sync engine', () => {
    const html = mountCard(succeeded({ engine: 'latentsync' })).html();
    expect(html).not.toContain('latentsync');
    expect(html).not.toContain('heygem');
  });

  it('shows the frame size, trace id and elapsed time on success', () => {
    const wrapper = mountCard(succeeded());
    expect(wrapper.vm.outputSize).toBe('1280×720');
    expect(wrapper.html()).toContain('trace-abc');
    expect(wrapper.html()).toContain('2502.00s');
  });

  it('omits the frame size when the response never reported one', () => {
    expect(mountCard(succeeded({ width: undefined, height: undefined })).vm.outputSize).toBeUndefined();
  });

  describe('face echo', () => {
    // A photo now travels in video_url, so only the extension distinguishes it.
    it.each([
      ['https://cdn.acedata.cloud/face.jpg', true],
      ['https://cdn.acedata.cloud/face.PNG?sig=1', true],
      ['https://cdn.acedata.cloud/face.mp4', false],
      ['https://cdn.acedata.cloud/face.mov?x=.png', false]
    ])('classifies %s', (url, isPhoto) => {
      const wrapper = mountCard({ ...succeeded(), request: { video_url: url } });
      expect(wrapper.vm.isPhotoFace).toBe(isPhoto);
      expect(wrapper.vm.faceUrl).toBe(url);
    });

    it('still reads a legacy image_url request', () => {
      const wrapper = mountCard({ ...succeeded(), request: { image_url: 'https://cdn.acedata.cloud/legacy' } });
      expect(wrapper.vm.isPhotoFace).toBe(true);
      expect(wrapper.vm.faceUrl).toBe('https://cdn.acedata.cloud/legacy');
    });
  });

  describe('in-progress eta', () => {
    const running = (ageSeconds: number): Partial<IDigitalHumanTask> => ({
      id: 'task_2',
      status: 'processing',
      created_at: Date.now() / 1000 - ageSeconds,
      response: { success: true, task_id: 'task_2', state: 'processing', progress: 40 }
    });

    it('counts down in minutes while there is time left', () => {
      expect(mountCard(running(600)).vm.etaText).toBe('digitalhuman.message.etaRemaining:{"minutes":30}');
    });

    // Past the estimate the honest answer is "soon", never a negative number.
    it('degrades to "almost done" once the estimate is spent', () => {
      expect(mountCard(running(9999)).vm.etaText).toBe('digitalhuman.message.etaAlmostDone');
    });

    it('has no eta without a creation time', () => {
      expect(mountCard({ id: 'x', status: 'pending' }).vm.etaText).toBeUndefined();
    });
  });

  it('reports the failure reason and trace id when a render dies', () => {
    const wrapper = mountCard({
      id: 'task_3',
      status: 'failed',
      elapsed: 12,
      request: { video_url: 'https://cdn.acedata.cloud/face.mp4' },
      response: { success: false, task_id: 'task_3', error: { message: 'gpu boom' }, trace_id: 'trace-xyz' }
    });
    expect(wrapper.vm.isFailure).toBe(true);
    expect(wrapper.html()).toContain('gpu boom');
    expect(wrapper.html()).toContain('trace-xyz');
  });
});
