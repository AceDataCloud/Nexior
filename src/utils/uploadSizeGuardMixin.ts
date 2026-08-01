/**
 * Drop-in `before-upload` guard for every `<el-upload>` posting to
 * `/api/v1/files/`. Bind it in the template:
 *
 *     :before-upload="beforeUploadSizeGuard"
 *
 * A component that advertises a stricter limit sets `uploadSizeLimitBytes`
 * (data or computed); it is clamped to the backend cap either way. See
 * `uploadSize.ts` for why the browser must refuse oversized files itself
 * rather than letting the request fail server-side.
 */

import { ElMessage } from 'element-plus';
import type { ComponentPublicInstance } from 'vue';
import { MAX_UPLOAD_BYTES, effectiveUploadLimit, formatBytes, isUploadSizeAllowed } from './uploadSize';

interface IGuardThis extends ComponentPublicInstance {
  uploadSizeLimitBytes?: number;
}

export const uploadSizeGuardMixin = {
  methods: {
    beforeUploadSizeGuard(this: IGuardThis, file: File): boolean {
      const limit = effectiveUploadLimit(this.uploadSizeLimitBytes ?? MAX_UPLOAD_BYTES);
      if (!isUploadSizeAllowed(file.size, limit)) {
        ElMessage.error(
          this.$t('common.message.uploadTooLarge', {
            size: formatBytes(file.size),
            max: formatBytes(limit)
          })
        );
        return false;
      }
      return true;
    }
  }
};

export default uploadSizeGuardMixin;
