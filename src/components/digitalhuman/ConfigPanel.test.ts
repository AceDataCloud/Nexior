// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('element-plus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('element-plus')>()),
  ElMessage: { warning: vi.fn(), error: vi.fn(), info: vi.fn(), success: vi.fn() }
}));

// The panel is exercised for its logic, not its markup; MediaInput drags in a
// video player whose module touches window.matchMedia at import time.
vi.mock('./config/MediaInput.vue', () => ({ default: { name: 'MediaInput', render: () => null } }));
vi.mock('./config/TimbreSelector.vue', () => ({ default: { name: 'TimbreSelector', render: () => null } }));

import ConfigPanel from './ConfigPanel.vue';
import { IDigitalHumanConfig } from '@/models';

const mountPanel = (config: IDigitalHumanConfig = {}) => {
  const commit = vi.fn();
  const wrapper = shallowMount(ConfigPanel, {
    global: {
      stubs: { teleport: true },
      mocks: {
        $t: (key: string) => key,
        $store: { state: { digitalhuman: { config, service: undefined } }, commit }
      }
    }
  });
  return { wrapper, commit };
};

const face = { video_url: 'https://cdn.acedata.cloud/face.mp4' };
const photo = { image_url: 'https://cdn.acedata.cloud/face.jpg' };
const spoken = { text: 'hello', voice_id: 'v1' };

describe('digitalhuman/ConfigPanel', () => {
  describe('missing', () => {
    it('names every unmet requirement rather than a bare boolean', () => {
      const { wrapper } = mountPanel({});
      expect(wrapper.vm.missing.map((m) => m.key)).toEqual(['face', 'text', 'timbre']);
    });

    it('drops a requirement as soon as it is satisfied', () => {
      expect(mountPanel({ ...face, text: 'hello' }).wrapper.vm.missing.map((m) => m.key)).toEqual(['timbre']);
      expect(mountPanel({ ...face, ...spoken }).wrapper.vm.missing).toEqual([]);
    });

    it('treats whitespace-only script as no script', () => {
      expect(mountPanel({ ...face, text: '   ', voice_id: 'v1' }).wrapper.vm.missing.map((m) => m.key)).toEqual([
        'text'
      ]);
    });

    it('asks for a recording instead of a script in audio mode', async () => {
      const { wrapper } = mountPanel({ ...face });
      wrapper.vm.voiceMode = 'audio';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.missing.map((m) => m.key)).toEqual(['audio']);
    });
  });

  describe('generate payload', () => {
    it('never carries the retired engine and resolution fields', () => {
      const { wrapper } = mountPanel({ ...face, ...spoken, engine: 'heygem', resolution: '540p' });
      wrapper.vm.onGenerate();
      const [request] = wrapper.emitted('generate')![0] as [Record<string, unknown>];
      expect(request).not.toHaveProperty('engine');
      expect(request).not.toHaveProperty('resolution');
    });

    // The API reads exactly one face field, so a photo has to travel in it.
    it('sends a photo through video_url and never as image_url', async () => {
      const { wrapper } = mountPanel({ ...photo, ...spoken });
      wrapper.vm.faceMode = 'photo';
      await wrapper.vm.$nextTick();
      wrapper.vm.onGenerate();
      const [request] = wrapper.emitted('generate')![0] as [Record<string, unknown>];
      expect(request.video_url).toBe(photo.image_url);
      expect(request).not.toHaveProperty('image_url');
    });

    it('omits an untouched speed but keeps an adjusted one', () => {
      const plain = mountPanel({ ...face, ...spoken, speed: 1 }).wrapper;
      plain.vm.onGenerate();
      expect((plain.emitted('generate')![0] as [Record<string, unknown>])[0]).not.toHaveProperty('speed');

      const fast = mountPanel({ ...face, ...spoken, speed: 1.3 }).wrapper;
      fast.vm.onGenerate();
      expect((fast.emitted('generate')![0] as [Record<string, unknown>])[0].speed).toBe(1.3);
    });

    it('carries only the active voice mode', async () => {
      const { wrapper } = mountPanel({ ...face, ...spoken, audio_url: 'https://cdn.acedata.cloud/a.wav' });
      wrapper.vm.voiceMode = 'audio';
      await wrapper.vm.$nextTick();
      wrapper.vm.onGenerate();
      const [request] = wrapper.emitted('generate')![0] as [Record<string, unknown>];
      expect(request.audio_url).toBe('https://cdn.acedata.cloud/a.wav');
      expect(request).not.toHaveProperty('text');
      expect(request).not.toHaveProperty('voice_id');
    });

    it('refuses to emit while something is missing', () => {
      const { wrapper } = mountPanel({});
      wrapper.vm.onGenerate();
      expect(wrapper.emitted('generate')).toBeUndefined();
    });
  });

  it('clears the opposite face field when the mode flips', () => {
    const { wrapper, commit } = mountPanel({ ...face });
    wrapper.vm.onFaceModeChange('photo');
    expect(commit).toHaveBeenCalledWith('digitalhuman/setConfig', expect.objectContaining({ video_url: undefined }));
  });
});
