// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AudioPreview from './AudioPreview.vue';

describe('AudioPreview', () => {
  it('uses a native button with an accessible name', () => {
    const wrapper = shallowMount(AudioPreview, { props: { url: 'track.mp3', name: 'Reference voice' } });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('aria-label')).toBe('Reference voice');
  });

  it('plays and pauses from the button action', async () => {
    const wrapper = shallowMount(AudioPreview, { props: { url: 'track.mp3', name: 'Reference voice' } });
    const audio = wrapper.get('audio').element as HTMLAudioElement;
    audio.play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(audio, 'paused', { configurable: true, value: true });

    await wrapper.trigger('click');
    expect(audio.play).toHaveBeenCalledOnce();
  });

  it('disables playback and announces media load failures', async () => {
    const wrapper = shallowMount(AudioPreview, {
      props: { url: 'missing.mp3', name: 'Reference voice' },
      global: { mocks: { $t: () => 'Preview unavailable' } }
    });

    await wrapper.get('audio').trigger('error');
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-label')).toBe('Reference voice: Preview unavailable');
  });
});
