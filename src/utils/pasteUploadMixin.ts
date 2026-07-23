/**
 * Mixin for `<el-upload>`-based components that adds clipboard paste support.
 *
 * Usage:
 *   1. Add `ref="uploader"` to the `<el-upload>` element.
 *   2. Add `mixins: [pasteUploadMixin]` to the component options.
 *   3. (Optional) override `pasteAccept` to match the upload's `accept`.
 *
 * The mixin will register itself with the global paste router on mount and
 * forward any pasted image to `uploader.handleStart(file)`.
 */

import type { ComponentPublicInstance } from 'vue';
import { registerPasteUploadTarget } from '@/utils/pasteUpload';
import { forwardFileToUploader } from '@/utils/uploadShared';

interface IPasteMixinThis extends ComponentPublicInstance {
  pasteAccept?: string;
  $refs: { uploader?: any } & ComponentPublicInstance['$refs'];
  __pasteUploadCleanup?: () => void;
}

export const pasteUploadMixin = {
  computed: {
    pasteAccept(): string {
      return '.png,.jpg,.jpeg,.gif,.bmp,.webp';
    }
  },
  mounted(this: IPasteMixinThis) {
    const id = Symbol('paste-upload-target');
    const el = (this.$el instanceof HTMLElement ? this.$el : null) as HTMLElement | null;
    this.__pasteUploadCleanup = registerPasteUploadTarget({
      id,
      accept: this.pasteAccept,
      el,
      handleFile: (file: File) => {
        forwardFileToUploader(this.$refs?.uploader, file);
      }
    });
  },
  beforeUnmount(this: IPasteMixinThis) {
    if (this.__pasteUploadCleanup) {
      this.__pasteUploadCleanup();
      this.__pasteUploadCleanup = undefined;
    }
  }
};

export default pasteUploadMixin;
