// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ReferenceAudioInput from './ReferenceAudioInput.vue';

const mountInput = (modelValue?: { audio: string; text: string }) =>
  shallowMount(ReferenceAudioInput, {
    props: { modelValue },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { token: { access: 'token' } } }
      }
    }
  });

describe('fish/ReferenceAudioInput', () => {
  it('emits the platform URL while preserving the transcript', () => {
    const wrapper = mountInput({ audio: '', text: 'Exact transcript' });
    (wrapper.vm as any).onUploadSuccess({ file_url: 'https://cdn.acedata.cloud/reference.mp3' }, {}, []);
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual({
      audio: 'https://cdn.acedata.cloud/reference.mp3',
      text: 'Exact transcript'
    });
  });

  it('accepts only MP3 and WAV uploads', () => {
    const wrapper = mountInput();
    expect((wrapper.vm as any).onBeforeUpload(new File(['audio'], 'voice.mp3'))).toBe(true);
    expect((wrapper.vm as any).onBeforeUpload(new File(['audio'], 'voice.wav'))).toBe(true);
    expect((wrapper.vm as any).onBeforeUpload(new File(['audio'], 'voice.webm'))).toBe(false);
  });

  it('clears a temporary reference without persisting it', async () => {
    const wrapper = mountInput({ audio: 'https://cdn.acedata.cloud/reference.mp3', text: 'Text' });
    await (wrapper.vm as any).clear();
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBeUndefined();
  });
});
