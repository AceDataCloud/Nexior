// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { IOpenAIImageConfig } from '@/models';
import AdvancedOptions from './AdvancedOptions.vue';

function mountOptions() {
  const state = reactive({
    token: { access: 'fixture' },
    openaiimage: {
      config: {
        model: 'gpt-image-2.6-flare',
        image_urls: ['https://example.test/base.png'],
        output_format: 'png'
      } as IOpenAIImageConfig
    }
  });
  const commit = vi.fn((_name: string, value: IOpenAIImageConfig) => {
    state.openaiimage.config = value;
  });
  const wrapper = shallowMount(AdvancedOptions, {
    global: {
      mocks: { $t: (key: string) => key, $store: { state, commit } },
      stubs: { InfoIcon: true, ImagePreview: true }
    }
  });
  return { wrapper, state };
}

describe('OpenAI Image advanced options', () => {
  it('clears 2.6-only complexity and markup when changing models', async () => {
    const { wrapper, state } = mountOptions();
    (wrapper.vm as any).complexity = 'low';
    const file = Object.assign(new File(['fixture'], 'markup.png', { type: 'image/png' }), { uid: 1 });
    (wrapper.vm as any).beforeUpload(file);
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/markup.png' }, file);
    expect(state.openaiimage.config).toMatchObject({ complexity: 'low', markup: 'https://example.test/markup.png' });
    state.openaiimage.config.model = 'gpt-image-2';
    await wrapper.vm.$nextTick();
    expect(state.openaiimage.config.complexity).toBeUndefined();
    expect(state.openaiimage.config.markup).toBeUndefined();
  });

  it.each(['gif', 'no-reference'])('does not retain an annotation after %s or a late upload', async (change) => {
    const { wrapper, state } = mountOptions();
    const file = Object.assign(new File(['fixture'], 'markup.png', { type: 'image/png' }), { uid: 1 });
    (wrapper.vm as any).beforeUpload(file);
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/markup.png' }, file);
    if (change === 'gif') state.openaiimage.config.output_format = 'gif';
    else state.openaiimage.config.image_urls = [];
    await wrapper.vm.$nextTick();
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/late.png' }, file);
    expect(state.openaiimage.config.markup).toBeUndefined();
  });
  it('cancels a pending annotation and ignores its callback after the reference changes', async () => {
    const { wrapper, state } = mountOptions();
    const first = Object.assign(new File(['old'], 'old.png', { type: 'image/png' }), { uid: 1 });
    (wrapper.vm as any).beforeUpload(first);
    (wrapper.vm as any).fileList = [{ uid: 1, name: 'old.png', status: 'uploading' }];
    state.openaiimage.config.image_urls = ['https://example.test/new.png'];
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).fileList).toEqual([]);
    const second = Object.assign(new File(['new'], 'new.png', { type: 'image/png' }), { uid: 2 });
    (wrapper.vm as any).beforeUpload(second);
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/old-annotation.png' }, first);
    expect(state.openaiimage.config.markup).toBeUndefined();
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/new-annotation.png' }, second);
    expect(state.openaiimage.config.markup).toBe('https://example.test/new-annotation.png');
  });
});
