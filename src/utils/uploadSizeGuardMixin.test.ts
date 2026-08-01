// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { ElUpload } from 'element-plus';
import { uploadSizeGuardMixin } from './uploadSizeGuardMixin';
import { MAX_UPLOAD_BYTES } from './uploadSize';

const errors: string[] = [];
vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { error: (msg: string) => errors.push(msg) }
  };
});

const fileOfSize = (bytes: number, name = 'clip.mov') => {
  const file = new File(['x'], name, { type: 'video/quicktime' });
  // Real multi-MB blobs are slow to allocate; the guard only reads `.size`.
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
};

const mountHost = (limit?: number) =>
  mount(
    defineComponent({
      name: 'GuardHost',
      components: { ElUpload },
      mixins: [uploadSizeGuardMixin],
      data: () => ({ uploadSizeLimitBytes: limit, fileList: [] as unknown[] }),
      template: `<el-upload ref="uploader" v-model:file-list="fileList" :before-upload="beforeUploadSizeGuard" action="#" />`
    }),
    { global: { mocks: { $t: (k: string) => k } } }
  );

describe('uploadSizeGuardMixin', () => {
  it('allows a file within the cap', () => {
    const wrapper = mountHost();
    expect(
      (wrapper.vm as never as { beforeUploadSizeGuard: (f: File) => boolean }).beforeUploadSizeGuard(
        fileOfSize(5 * 1024 * 1024)
      )
    ).toBe(true);
  });

  it('rejects a file over the cap and reports it', () => {
    errors.length = 0;
    const wrapper = mountHost();
    const vm = wrapper.vm as never as { beforeUploadSizeGuard: (f: File) => boolean };
    expect(vm.beforeUploadSizeGuard(fileOfSize(MAX_UPLOAD_BYTES + 1))).toBe(false);
    expect(errors).toHaveLength(1);
  });

  it('clamps a per-surface limit that exceeds the backend cap', () => {
    const wrapper = mountHost(200 * 1024 * 1024);
    const vm = wrapper.vm as never as { beforeUploadSizeGuard: (f: File) => boolean };
    expect(vm.beforeUploadSizeGuard(fileOfSize(150 * 1024 * 1024))).toBe(false);
  });

  it('leaves no file stuck in the upload queue when it is rejected', async () => {
    // The bug this guards: an oversized file that reaches the network stays
    // `status: "uploading"` forever, so any "no upload in flight" gate (the
    // chat send button) stays disabled. Returning false must drop the file.
    const wrapper = mountHost();
    const vm = wrapper.vm as never as { fileList: { status?: string }[] };
    const uploader = wrapper.vm.$refs.uploader as unknown as {
      handleStart: (f: File) => void;
      submit: () => void;
    };
    uploader.handleStart(fileOfSize(MAX_UPLOAD_BYTES + 1));
    await nextTick();
    expect(vm.fileList).toHaveLength(1);
    uploader.submit();
    await nextTick();
    await nextTick();
    expect(vm.fileList).toHaveLength(0);
  });

  it('keeps an allowed file queued so it can actually upload', async () => {
    const wrapper = mountHost();
    const vm = wrapper.vm as never as { fileList: { status?: string }[] };
    const uploader = wrapper.vm.$refs.uploader as unknown as { handleStart: (f: File) => void };
    uploader.handleStart(fileOfSize(1024));
    await nextTick();
    expect(vm.fileList).toHaveLength(1);
  });
});
