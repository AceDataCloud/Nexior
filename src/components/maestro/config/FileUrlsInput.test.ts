// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import type { UploadFile } from 'element-plus';
import { afterEach, describe, expect, it, vi } from 'vitest';

import FilePreview from '@/components/common/FilePreview.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import FileUrlsInput from './FileUrlsInput.vue';

const imageFile = {
  name: 'storyboard.png',
  uid: 1,
  status: 'success',
  percentage: 100,
  url: 'https://cdn.example.com/storyboard.png',
  response: { file_url: 'https://cdn.example.com/storyboard.png' }
} as UploadFile;

const audioFile = {
  name: 'narration.mp3',
  uid: 2,
  status: 'success',
  percentage: 100,
  url: 'https://cdn.example.com/narration.mp3',
  response: { file_url: 'https://cdn.example.com/narration.mp3' }
} as UploadFile;

const mountComponent = () => {
  const commit = vi.fn();
  const wrapper = shallowMount(FileUrlsInput, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: {
            token: { access: 'test-token' },
            maestro: { config: { prompt: 'Create a launch video' } }
          },
          commit
        }
      }
    }
  });

  return { wrapper, commit };
};

describe('maestro/config/FileUrlsInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the shared image and file previews for mixed uploads', async () => {
    const { wrapper } = mountComponent();

    await wrapper.setData({ fileList: [imageFile, audioFile] });

    expect(wrapper.findAllComponents(ImagePreview)).toHaveLength(1);
    expect(wrapper.findAllComponents(FilePreview)).toHaveLength(1);
  });

  it('removes a preview and syncs only completed file URLs to Maestro config', async () => {
    const { wrapper, commit } = mountComponent();
    await wrapper.setData({ fileList: [imageFile, audioFile] });

    (wrapper.vm as unknown as { onRemovePreview: (index: number, file: UploadFile) => void }).onRemovePreview(
      0,
      imageFile
    );

    expect(commit).toHaveBeenCalledWith('maestro/setConfig', {
      prompt: 'Create a launch video',
      file_urls: ['https://cdn.example.com/narration.mp3']
    });
  });

  it('aborts an in-progress upload before removing its preview', async () => {
    const { wrapper } = mountComponent();
    const abort = vi.fn();
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const uploadingFile = {
      name: 'storyboard.png',
      uid: 3,
      status: 'uploading',
      percentage: 50,
      url: 'blob:storyboard'
    } as UploadFile;
    await wrapper.setData({ fileList: [uploadingFile] });
    Object.assign(wrapper.vm.$refs.uploader as object, { abort });

    (wrapper.vm as unknown as { onRemovePreview: (index: number, file: UploadFile) => void }).onRemovePreview(
      0,
      uploadingFile
    );

    expect(abort).toHaveBeenCalledWith(uploadingFile);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:storyboard');
    expect((wrapper.vm as unknown as { fileList: UploadFile[] }).fileList).toHaveLength(0);
  });

  it('releases a local image preview when an upload fails', async () => {
    const { wrapper } = mountComponent();
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const failedFile = {
      name: 'storyboard.png',
      uid: 4,
      status: 'fail',
      percentage: 35,
      url: 'blob:storyboard'
    } as UploadFile;

    (wrapper.vm as unknown as { onError: (error: Error, file: UploadFile) => void }).onError(
      new Error('upload failed'),
      failedFile
    );

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:storyboard');
  });

  it('removes a broken preview when a successful response has no file URL', async () => {
    const { wrapper, commit } = mountComponent();
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const malformedFile = {
      name: 'storyboard.png',
      uid: 5,
      status: 'success',
      percentage: 100,
      url: 'blob:storyboard'
    } as UploadFile;
    await wrapper.setData({ fileList: [malformedFile] });

    (wrapper.vm as unknown as { onSuccess: (response: unknown, file: UploadFile) => void }).onSuccess(
      {},
      malformedFile
    );

    expect((wrapper.vm as unknown as { fileList: UploadFile[] }).fileList).toHaveLength(0);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:storyboard');
    expect(commit).toHaveBeenLastCalledWith('maestro/setConfig', {
      prompt: 'Create a launch video',
      file_urls: []
    });
  });

  it('replaces a local image preview once and does not recreate it after upload success', () => {
    const { wrapper } = mountComponent();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:storyboard');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const file = {
      name: 'storyboard.png',
      uid: 6,
      status: 'ready',
      percentage: 0,
      raw: new File(['image'], 'storyboard.png', { type: 'image/png' })
    } as UploadFile;
    const vm = wrapper.vm as unknown as {
      onFileChange: (file: UploadFile) => void;
      onSuccess: (response: unknown, file: UploadFile) => void;
    };

    vm.onFileChange(file);
    file.status = 'success';
    vm.onSuccess({ file_url: 'https://cdn.example.com/storyboard.png' }, file);
    vm.onFileChange(file);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:storyboard');
    expect(file.url).toBe('https://cdn.example.com/storyboard.png');
  });

  it('releases local image previews when the component unmounts', async () => {
    const { wrapper } = mountComponent();
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    await wrapper.setData({
      fileList: [
        { name: 'one.png', uid: 7, url: 'blob:one', status: 'ready' },
        { name: 'two.png', uid: 8, url: 'blob:two', status: 'uploading' }
      ]
    });

    wrapper.unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:one');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:two');
  });
});
