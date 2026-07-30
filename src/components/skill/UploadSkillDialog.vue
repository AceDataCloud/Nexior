<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('skill.dialog.uploadTitle')"
    width="min(520px, 94vw)"
    align-center
    :close-on-click-modal="!uploading"
    :close-on-press-escape="!uploading"
    :show-close="!uploading"
    @update:model-value="onVisibleChange"
    @closed="reset"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".tar.gz,.tgz,.tar,.zip,.md,application/gzip,application/zip,application/x-tar,text/markdown"
      hidden
      @change="onFilePicked"
    />

    <!-- Dropzone -->
    <div
      class="dropzone"
      :class="{ 'is-dragging': isDragging, 'has-file': !!file }"
      @click="onPickFile"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <add-file-icon class="dropzone-icon" size="1em" aria-hidden="true" focusable="false" />
      <p v-if="!file" class="dropzone-hint">{{ $t('skill.dialog.uploadDrop') }}</p>
      <p v-else class="dropzone-file">
        <span class="dropzone-file-name">{{ file.name }}</span>
        <span class="dropzone-file-size">{{ humanSize(file.size) }}</span>
      </p>
    </div>

    <!-- Requirements -->
    <div class="requirements">
      <p class="requirements-title">{{ $t('skill.dialog.fileRequirements') }}</p>
      <ul>
        <li>{{ $t('skill.dialog.requirementMd') }}</li>
        <li>{{ $t('skill.dialog.requirementArchive') }}</li>
      </ul>
    </div>

    <template #footer>
      <el-button :disabled="uploading" @click="onClose">{{ $t('skill.button.cancel') }}</el-button>
      <el-button type="primary" :loading="uploading" :disabled="!file" @click="onSubmit">
        <cloud-upload-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
        {{ $t('skill.button.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElButton, ElMessage } from 'element-plus';
import { AddFileIcon, CloudUploadIcon } from '@acedatacloud/core/icons/components';
import { skillOperator } from '@/operators/skill';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = /\.(tar\.gz|tgz|tar|zip|md)$/i;

export default defineComponent({
  name: 'UploadSkillDialog',
  components: { ElDialog, ElButton, AddFileIcon, CloudUploadIcon },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      file: null as File | null,
      isDragging: false,
      uploading: false
    };
  },
  methods: {
    onVisibleChange(visible: boolean) {
      this.$emit('update:modelValue', visible);
    },
    onClose() {
      if (this.uploading) return;
      this.$emit('update:modelValue', false);
    },
    reset() {
      this.file = null;
      this.isDragging = false;
      const input = this.$refs.fileInput as HTMLInputElement | undefined;
      if (input) input.value = '';
    },
    humanSize(bytes: number): string {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    },
    onPickFile() {
      if (this.uploading) return;
      const input = this.$refs.fileInput as HTMLInputElement | undefined;
      input?.click();
    },
    onFilePicked(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0] || null;
      this.acceptFile(file);
    },
    onDrop(event: DragEvent) {
      this.isDragging = false;
      const file = event.dataTransfer?.files?.[0] || null;
      this.acceptFile(file);
    },
    acceptFile(file: File | null) {
      if (!file) {
        this.file = null;
        return;
      }
      if (file.size > MAX_BYTES) {
        ElMessage.error(this.$t('skill.message.fileTooLarge') as string);
        return;
      }
      if (!ALLOWED_EXT.test(file.name)) {
        ElMessage.error(this.$t('skill.message.fileTypeWrong') as string);
        return;
      }
      this.file = file;
    },
    extractError(err: unknown): string {
      const e = err as { response?: { data?: { detail?: string; content?: string[] } } };
      return (
        e?.response?.data?.detail || (e?.response?.data?.content || []).join('; ') || String(err) || 'unknown error'
      );
    },
    async onSubmit() {
      if (!this.file) return;
      this.uploading = true;
      try {
        // For raw .md uploads, send as text body; for archives use multipart.
        if (/\.md$/i.test(this.file.name)) {
          const content = await this.file.text();
          const { data } = await skillOperator.createMarkdown({ content });
          ElMessage.success(this.$t('skill.message.createSuccess'));
          this.$emit('created', data.id);
        } else {
          const { data } = await skillOperator.createTarball(this.file);
          ElMessage.success(this.$t('skill.message.createSuccess'));
          this.$emit('created', data.id);
        }
        this.$emit('update:modelValue', false);
      } catch (err) {
        ElMessage.error(this.$t('skill.message.createFailed', { detail: this.extractError(err) }));
      } finally {
        this.uploading = false;
      }
    }
  }
});
</script>

<style scoped>
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 36px 16px;
  border: 1.5px dashed var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  text-align: center;
}

.dropzone:hover,
.dropzone.is-dragging {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.dropzone.has-file {
  border-style: solid;
  border-color: var(--el-color-primary-light-3);
}

.dropzone-icon {
  width: 36px;
  height: 36px;
  color: var(--el-text-color-secondary);
}

.dropzone-hint {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.dropzone-file {
  margin: 0;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropzone-file-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--el-text-color-primary);
}

.dropzone-file-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.requirements {
  margin-top: 18px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.requirements-title {
  margin: 0 0 6px 0;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.requirements ul {
  margin: 0;
  padding-left: 18px;
}

.requirements li {
  margin: 2px 0;
}
</style>
