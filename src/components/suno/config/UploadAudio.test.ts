// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UploadAudio from './UploadAudio.vue';
import { sunoOperator } from '@/operators';
vi.mock('@/utils', () => ({
  getBaseUrlPlatform: () => 'https://platform.example',
  uploadTrackerMixin: {},
  uploadSizeGuardMixin: {}
}));
vi.mock('@/operators', () => ({ sunoOperator: { upload: vi.fn() } }));
describe('shared audio picker import boundary', () => {
  beforeEach(() => vi.clearAllMocks());
  it('prepares an audio URL for ACE without importing or mutating Suno', async () => {
    const store = createStore({ state: { token: {}, suno: { config: { action: 'generate' }, credential: {} } } });
    const wrapper = mount(UploadAudio, {
      props: { importOnSelect: false },
      global: { plugins: [store], mocks: { $t: (key: string) => key }, stubs: { ElDialog: true, ElUpload: true } }
    });
    await (wrapper.vm as any).onGenerateAudioId('https://example.com/own.mp3');
    expect(wrapper.emitted('uploaded')).toEqual([['https://example.com/own.mp3']]);
    expect(sunoOperator.upload).not.toHaveBeenCalled();
    expect(store.state.suno.config).toEqual({ action: 'generate' });
    wrapper.unmount();
  });
  it('preserves the default Suno import operation', async () => {
    vi.mocked(sunoOperator.upload).mockResolvedValue({ data: { data: { audio_id: 'suno-audio' } } } as any);
    const commit = vi.fn();
    const store = createStore({
      state: { token: {}, suno: { config: { action: 'generate' }, credential: { token: 'test-key' } } },
      mutations: { 'suno/setConfig': (_, v) => commit(v) }
    });
    const wrapper = mount(UploadAudio, {
      global: { plugins: [store], mocks: { $t: (key: string) => key }, stubs: { ElDialog: true, ElUpload: true } }
    });
    await (wrapper.vm as any).onGenerateAudioId('https://example.com/own.mp3');
    expect(sunoOperator.upload).toHaveBeenCalledWith(
      { audio_url: 'https://example.com/own.mp3' },
      { token: 'test-key' }
    );
    expect(commit).toHaveBeenCalledWith({ action: 'upload_extend', audio_id: 'suno-audio' });
    expect(wrapper.emitted('uploaded')).toBeUndefined();
    wrapper.unmount();
  });
});
