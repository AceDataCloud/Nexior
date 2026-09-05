<template>
  <el-dialog
    v-model="visible"
    :title="$t('suno.customModel.createTitle')"
    width="min(560px, 92vw)"
    :close-on-click-modal="false"
  >
    <el-alert type="warning" :closable="false" class="mb-4" :title="$t('suno.customModel.rightsNotice')" />
    <el-form label-position="top">
      <el-form-item :label="$t('suno.customModel.modelName')">
        <el-input v-model="name" maxlength="100" :placeholder="$t('suno.customModel.namePlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('suno.customModel.audioUrls')">
        <el-input v-model="urlsText" type="textarea" :rows="9" :placeholder="$t('suno.customModel.urlsPlaceholder')" />
        <div class="text-xs text-gray-400 mt-1">{{ $t('suno.customModel.urlCount', { count: urls.length }) }}</div>
      </el-form-item>
      <el-checkbox v-model="rightsConfirmed">{{ $t('suno.customModel.rightsConfirm') }}</el-checkbox>
      <div class="text-sm mt-3">{{ $t('suno.customModel.createPrice') }}</div>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" :loading="loading" :disabled="!canSubmit" @click="onSubmit">
        {{ $t('suno.customModel.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElCheckbox, ElDialog, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { sunoOperator } from '@/operators/suno';

export default defineComponent({
  name: 'CustomModelCreateDialog',
  components: { ElAlert, ElButton, ElCheckbox, ElDialog, ElForm, ElFormItem, ElInput },
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      name: '',
      urlsText: '',
      rightsConfirmed: false,
      loading: false,
      submittedFingerprint: '',
      idempotencyKey: ''
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
    urls(): string[] {
      return this.urlsText
        .split(/\r?\n/)
        .map((value: string) => value.trim())
        .filter(Boolean);
    },
    canSubmit(): boolean {
      return (
        !!this.name.trim() &&
        this.urls.length >= 6 &&
        this.urls.length <= 24 &&
        new Set(this.urls).size === this.urls.length &&
        this.urls.every((value: string) => value.startsWith('https://')) &&
        this.rightsConfirmed &&
        !!this.$store.state.suno?.credential?.token
      );
    }
  },
  methods: {
    async onSubmit() {
      const token = this.$store.state.suno?.credential?.token;
      if (!token || !this.canSubmit) return;
      this.loading = true;
      try {
        const payload = { action: 'create' as const, name: this.name.trim(), audio_urls: this.urls };
        const fingerprint = JSON.stringify(payload);
        if (fingerprint !== this.submittedFingerprint) {
          this.submittedFingerprint = fingerprint;
          this.idempotencyKey = crypto.randomUUID();
        }
        await sunoOperator.createCustomModel(payload, { token, idempotencyKey: this.idempotencyKey });
        ElMessage.success(this.$t('suno.customModel.createAccepted'));
        this.$emit('created');
        this.visible = false;
        this.name = '';
        this.urlsText = '';
        this.rightsConfirmed = false;
        this.submittedFingerprint = '';
        this.idempotencyKey = '';
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.error?.message || this.$t('suno.customModel.createFailed'));
      } finally {
        this.loading = false;
      }
    }
  }
});
</script>
