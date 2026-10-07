<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="dialogWidth"
    :close-on-click-modal="false"
    append-to-body
    @closed="onClosed"
  >
    <image-cropper-viewport
      v-if="imageSrc"
      ref="cropperRef"
      class="image-cropper"
      :src="imageSrc"
      :shape="shape"
      :aspect-ratio="aspectRatio"
      :labels="cropperLabels"
      control-size="large"
      checkerboard
      @replace="openPicker"
    />
    <div v-else class="dropzone" @click="openPicker" @drop.prevent="onDrop" @dragover.prevent>
      <el-icon class="dropzone-icon"><Upload :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
      <p class="dropzone-text">{{ $t('site.imageCropper.dropHere') }}</p>
      <p class="dropzone-hint">{{ resolvedFormatHint }}</p>
    </div>
    <input ref="fileInput" type="file" :accept="accept" hidden @change="onPick" />

    <template #footer>
      <el-button @click="visible = false">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" :loading="uploading" :disabled="!imageSrc" @click="onConfirm">
        {{ $t('common.button.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import {
  ImageCropperViewport,
  type ImageCropperViewportHandle
} from '@acedatacloud/core/components/image-cropper-viewport';
import { UploadIcon as Upload } from '@acedatacloud/core/icons/components';
import '@acedatacloud/core/image-cropper.css';
import { defineComponent, PropType } from 'vue';
import { ElDialog, ElButton, ElIcon, ElMessage } from 'element-plus';

import 'vue-advanced-cropper/dist/style.css';
import { httpClient } from '@/operators/common';

type StencilShape = 'circle' | 'rectangle';

export default defineComponent({
  name: 'ImageCropper',
  components: {
    ElDialog,
    ElButton,
    ElIcon,
    ImageCropperViewport,
    Upload
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    /** Stencil shape — circle for avatars, rectangle for banners / logos / favicons. */
    shape: {
      type: String as PropType<StencilShape>,
      default: 'rectangle'
    },
    /** Stencil aspect ratio (width / height). Only applies to rectangle. */
    aspectRatio: {
      type: Number,
      default: 1
    },
    /** Output canvas width in px (height derived from aspectRatio). */
    outputWidth: {
      type: Number,
      default: 512
    },
    accept: {
      type: String,
      default: 'image/*'
    },
    dialogWidth: {
      type: String,
      default: '640px'
    },
    /**
     * Optional override for the dropzone hint shown above the file picker —
     * when the consumer (e.g. EditImage) already has a more specific tip such
     * as "建议尺寸：200*60px", pass it here. Falls back to the generic
     * `site.imageCropper.formatHint` translation.
     */
    formatHint: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'uploaded'],
  data() {
    return {
      imageSrc: '' as string,
      // Source mime captured at file pick time. PNG / WEBP / GIF carry an alpha
      // channel — we must re-encode to PNG on confirm, otherwise JPEG flattens
      // transparent pixels to black on upload (favicon bug).
      sourceMime: '' as string,
      uploading: false,
      Upload
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value);
      }
    },
    cropperLabels() {
      return {
        zoomIn: this.$t('site.imageCropper.zoomIn') as string,
        zoomOut: this.$t('site.imageCropper.zoomOut') as string,
        rotateLeft: this.$t('site.imageCropper.rotateLeft') as string,
        rotateRight: this.$t('site.imageCropper.rotateRight') as string,
        flipHorizontal: this.$t('site.imageCropper.flipHorizontal') as string,
        replace: this.$t('site.imageCropper.replace') as string
      };
    },
    resolvedFormatHint(): string {
      return this.formatHint || (this.$t('site.imageCropper.formatHint') as string);
    }
  },
  watch: {
    modelValue(open: boolean) {
      if (open) {
        // Reset image on every open so the next edit starts fresh.
        this.imageSrc = '';
      }
    }
  },
  methods: {
    openPicker() {
      (this.$refs.fileInput as HTMLInputElement).click();
    },
    onPick(e: Event) {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) this.loadFile(file);
      target.value = '';
    },
    onDrop(e: DragEvent) {
      const file = e.dataTransfer?.files?.[0];
      if (file) this.loadFile(file);
    },
    loadFile(file: File) {
      if (!file.type.startsWith('image/')) {
        ElMessage.error(this.$t('site.imageCropper.invalidType') as string);
        return;
      }
      this.sourceMime = file.type;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageSrc = (e.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    },
    /** Source has an alpha channel → keep PNG so transparency survives upload. */
    hasAlpha(): boolean {
      const m = this.sourceMime;
      return m === 'image/png' || m === 'image/webp' || m === 'image/gif';
    },
    onClosed() {
      this.imageSrc = '';
      this.sourceMime = '';
      this.uploading = false;
    },
    async onConfirm() {
      const result = (this.$refs.cropperRef as ImageCropperViewportHandle | undefined)?.getResult();
      const canvas = result?.canvas;
      if (!canvas) {
        ElMessage.error(this.$t('site.imageCropper.noImage') as string);
        return;
      }

      const targetW = this.outputWidth;
      const targetH = Math.round(targetW / this.aspectRatio);
      const out = document.createElement('canvas');
      out.width = targetW;
      out.height = targetH;
      const ctx = out.getContext('2d');
      if (!ctx) {
        ElMessage.error(this.$t('site.imageCropper.canvasError') as string);
        return;
      }
      ctx.drawImage(canvas, 0, 0, targetW, targetH);

      const keepAlpha = this.hasAlpha();
      const outMime = keepAlpha ? 'image/png' : 'image/jpeg';
      const outExt = keepAlpha ? 'png' : 'jpg';

      this.uploading = true;
      try {
        const blob: Blob = await new Promise((resolve, reject) => {
          // PNG ignores the quality arg; passing it is harmless.
          out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), outMime, 0.92);
        });
        const filename = `image-${Date.now()}.${outExt}`;
        const formData = new FormData();
        formData.append('file', blob, filename);
        const { data } = await httpClient.post<{ file_url: string }>('/files/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        });
        this.$emit('uploaded', data.file_url);
        this.visible = false;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { detail?: string; error?: string } }; message?: string };
        ElMessage.error(
          e?.response?.data?.detail ||
            e?.response?.data?.error ||
            e?.message ||
            (this.$t('site.imageCropper.uploadFailed') as string)
        );
      } finally {
        this.uploading = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.image-cropper {
  --adc-image-cropper-height: 360px;
  --adc-image-cropper-radius: 8px;
}

.dropzone {
  height: 360px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }
  .dropzone-icon {
    font-size: 36px;
    color: var(--el-text-color-secondary);
  }
  .dropzone-text {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
  .dropzone-hint {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
