// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import ModelConfigPanel from './ModelConfigPanel.vue';

const mountPanel = () =>
  shallowMount(ModelConfigPanel, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { token: { access: 'access-token' } } }
      }
    }
  });

const fillForm = async (wrapper: ReturnType<typeof mountPanel>) => {
  await wrapper.setData({
    form: {
      title: ' My voice ',
      description: ' Description ',
      texts: ' Transcript ',
      voicesUrl: 'https://cdn.acedata.cloud/audio.mp3',
      visibility: 'private',
      enhanceAudio: true,
      generateSample: false
    },
    fileList: [{ name: 'audio.mp3' }]
  });
};

describe('fish/ModelConfigPanel', () => {
  it('keeps the form pending until the parent resolves and then resets it', async () => {
    const wrapper = mountPanel();
    await fillForm(wrapper);

    const submission = (wrapper.vm as any).onCreate();
    await nextTick();

    const [payload, callbacks] = wrapper.emitted('create')?.[0] as any;
    expect(payload).toMatchObject({
      title: 'My voice',
      voices: 'https://cdn.acedata.cloud/audio.mp3',
      description: 'Description',
      texts: ['Transcript'],
      train_mode: 'fast'
    });
    expect((wrapper.vm as any).creating).toBe(true);
    expect((wrapper.vm as any).form.title).toBe(' My voice ');

    callbacks.resolve();
    await submission;

    expect((wrapper.vm as any).creating).toBe(false);
    expect((wrapper.vm as any).form.title).toBe('');
    expect((wrapper.vm as any).form.voicesUrl).toBe('');
    expect((wrapper.vm as any).fileList).toEqual([]);
  });

  it('restores the button but preserves the form when creation fails', async () => {
    const wrapper = mountPanel();
    await fillForm(wrapper);

    const submission = (wrapper.vm as any).onCreate();
    await nextTick();
    const [, callbacks] = wrapper.emitted('create')?.[0] as any;

    callbacks.reject(new Error('creation failed'));
    await submission;

    expect((wrapper.vm as any).creating).toBe(false);
    expect((wrapper.vm as any).form.title).toBe(' My voice ');
    expect((wrapper.vm as any).form.voicesUrl).toBe('https://cdn.acedata.cloud/audio.mp3');
    expect((wrapper.vm as any).fileList).toHaveLength(1);
  });

  it('ignores extra clicks while a submission is still in flight', async () => {
    const wrapper = mountPanel();
    await fillForm(wrapper);

    const submission = (wrapper.vm as any).onCreate();
    await nextTick();
    await (wrapper.vm as any).onCreate();
    await nextTick();

    expect(wrapper.emitted('create')).toHaveLength(1);
    expect((wrapper.vm as any).canCreate).toBe(false);

    const [, callbacks] = wrapper.emitted('create')?.[0] as any;
    callbacks.resolve();
    await submission;
  });

  it('does not expose the unsupported precise training mode', async () => {
    const wrapper = mountPanel();
    await fillForm(wrapper);

    const submission = (wrapper.vm as any).onCreate();
    await nextTick();
    const [payload, callbacks] = wrapper.emitted('create')?.[0] as any;

    expect(wrapper.text()).not.toContain('fish.value.trainModePrecise');
    expect(payload.train_mode).toBe('fast');

    callbacks.resolve();
    await submission;
  });
});
