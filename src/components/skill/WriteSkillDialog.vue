<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('skill.dialog.writeTitle')"
    width="min(720px, 94vw)"
    align-center
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    @update:model-value="onVisibleChange"
    @closed="reset"
  >
    <p class="hint">{{ $t('skill.dialog.writeHint') }}</p>
    <el-input
      v-model="content"
      type="textarea"
      :rows="18"
      :placeholder="$t('skill.placeholder.content')"
      spellcheck="false"
      class="editor"
    />

    <template #footer>
      <el-button :disabled="saving" @click="onClose">{{ $t('skill.button.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!content.trim()" @click="onSubmit">
        <cloud-upload-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
        {{ $t('skill.button.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElButton, ElInput, ElMessage } from 'element-plus';
import { CloudUploadIcon } from '@acedatacloud/core/icons/components';
import { skillOperator } from '@/operators/skill';

export default defineComponent({
  name: 'WriteSkillDialog',
  components: { ElDialog, ElButton, ElInput, CloudUploadIcon },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      content: '',
      saving: false
    };
  },
  methods: {
    onVisibleChange(visible: boolean) {
      this.$emit('update:modelValue', visible);
    },
    onClose() {
      if (this.saving) return;
      this.$emit('update:modelValue', false);
    },
    reset() {
      this.content = '';
    },
    extractError(err: unknown): string {
      const e = err as { response?: { data?: { detail?: string; content?: string[] } } };
      return (
        e?.response?.data?.detail || (e?.response?.data?.content || []).join('; ') || String(err) || 'unknown error'
      );
    },
    async onSubmit() {
      if (!this.content.trim()) return;
      this.saving = true;
      try {
        const { data } = await skillOperator.createMarkdown({ content: this.content });
        ElMessage.success(this.$t('skill.message.createSuccess'));
        this.$emit('created', data.id);
        this.$emit('update:modelValue', false);
      } catch (err) {
        ElMessage.error(this.$t('skill.message.createFailed', { detail: this.extractError(err) }));
      } finally {
        this.saving = false;
      }
    }
  }
});
</script>

<style scoped>
.hint {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.editor :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 13px;
  line-height: 1.55;
}
</style>
