// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReferenceMediaInput from './ReferenceMediaInput.vue';

const wrappers: ReturnType<typeof shallowMount>[] = [];

const mountInput = () => {
  const wrapper = shallowMount(ReferenceMediaInput, {
    props: {
      kind: 'image',
      title: 'Reference images',
      description: 'Upload reference images',
      limit: 9
    },
    global: {
      mocks: {
        $store: { state: { token: { access: 'token' } } },
        $t: (key: string) => key
      }
    }
  });
  wrappers.push(wrapper);
  return wrapper;
};

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  vi.restoreAllMocks();
});

describe('MinimaxReferenceMediaInput', () => {
  it('emits only completed upload URLs while another file still has a blob preview', async () => {
    const wrapper = mountInput();
    await wrapper.setData({
      fileList: [
        {
          name: 'ready.png',
          url: 'https://cdn.example.com/ready.png',
          response: { file_url: 'https://cdn.example.com/ready.png' }
        },
        { name: 'uploading.png', url: 'blob:local-preview', percentage: 50 }
      ]
    });

    (wrapper.vm as any).emitUrls();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['https://cdn.example.com/ready.png']]);
  });

  it('uses the media-specific accept list for file selection and paste', () => {
    const wrapper = mountInput();

    expect((wrapper.vm as any).accept).toContain('image/*');
    expect((wrapper.vm as any).pasteAccept).toBe((wrapper.vm as any).accept);
  });

  it('releases a local preview after the upload returns a CDN URL', async () => {
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const wrapper = mountInput();
    const file = { name: 'reference.png', url: 'blob:local-preview' };
    await wrapper.setData({ fileList: [file] });

    (wrapper.vm as any).onSuccess({ file_url: 'https://cdn.example.com/reference.png' }, file);

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-preview');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['https://cdn.example.com/reference.png']]);
  });

  it('replaces and clears completed previews when the parent value changes', async () => {
    const wrapper = mountInput();
    await wrapper.setProps({ modelValue: ['https://cdn.example.com/old.png'] });
    await wrapper.setData({
      fileList: [...(wrapper.vm as any).fileList, { name: 'uploading.png', url: 'blob:local-preview', percentage: 50 }]
    });

    await wrapper.setProps({ modelValue: ['https://cdn.example.com/new.png'] });
    expect((wrapper.vm as any).fileList.map((file: any) => file.response?.file_url || file.url)).toEqual([
      'https://cdn.example.com/new.png',
      'blob:local-preview'
    ]);

    await wrapper.setProps({ modelValue: [] });
    expect((wrapper.vm as any).fileList.map((file: any) => file.url)).toEqual(['blob:local-preview']);
  });
});
