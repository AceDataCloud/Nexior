<template>
  <el-dialog
    :model-value="visible"
    :title="credential ? $t('byok.title.editCredential') : $t('byok.title.addCredential')"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="onClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="$t('byok.field.provider')" prop="provider">
        <el-select
          v-model="form.provider"
          :placeholder="$t('byok.field.provider')"
          :disabled="!!credential"
          class="w-full"
        >
          <el-option v-for="opt in providers" :key="opt.id" :label="opt.label" :value="opt.id" />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('byok.field.label')">
        <el-input
          v-model="form.label"
          :placeholder="$t('byok.field.labelPlaceholder')"
          maxlength="64"
          show-word-limit
        />
      </el-form-item>

      <el-form-item :label="$t('byok.field.apiKey')" prop="api_key">
        <el-input
          v-model="form.api_key"
          type="password"
          autocomplete="new-password"
          show-password
          :placeholder="credential ? $t('byok.field.apiKeyEditPlaceholder') : $t('byok.field.apiKeyPlaceholder')"
        />
      </el-form-item>

      <div class="advanced-toggle" @click="advancedOpen = !advancedOpen">
        <font-awesome-icon
          :icon="advancedOpen ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right'"
          class="text-[10px]"
        />
        <span>{{ $t('byok.message.advancedToggle') }}</span>
      </div>
      <div v-if="advancedOpen" class="advanced-section">
        <el-form-item :label="$t('byok.field.baseUrl')" prop="base_url">
          <el-input v-model="form.base_url" :placeholder="placeholderBaseUrl" />
          <p class="hint">{{ $t('byok.message.baseUrlHelp') }}</p>
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="onClose(false)">{{ $t('byok.button.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="onSubmit">
        {{ $t('byok.button.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  type FormInstance,
  type FormRules
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { byokCredentialOperator } from '@/operators';
import type { IBYOKCredential, IBYOKCredentialCreatePayload, IBYOKProvider, IBYOKProviderInfo } from '@/models';

export default defineComponent({
  name: 'BYOKDialog',
  components: {
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElOption,
    ElSelect,
    FontAwesomeIcon
  },
  props: {
    visible: { type: Boolean, default: false },
    credential: { type: Object as PropType<IBYOKCredential | null>, default: null },
    providers: { type: Array as PropType<IBYOKProviderInfo[]>, default: () => [] },
    token: { type: String, default: '' }
  },
  emits: ['update:visible', 'saved'],
  data() {
    const form: { provider: IBYOKProvider | ''; api_key: string; base_url: string; label: string } = {
      provider: '',
      api_key: '',
      base_url: '',
      label: ''
    };
    return {
      form,
      advancedOpen: false,
      saving: false
    };
  },
  computed: {
    rules(): FormRules {
      return {
        provider: [{ required: true, message: this.$t('byok.field.provider'), trigger: 'change' }],
        api_key: [
          {
            // On edit, empty api_key means "keep current" — only enforce on create.
            required: !this.credential,
            message: this.$t('byok.field.apiKeyPlaceholder'),
            trigger: 'blur'
          }
        ]
      };
    },
    placeholderBaseUrl(): string {
      const provider = this.form.provider;
      const info = this.providers.find((p) => p.id === provider);
      return info?.default_base_url ?? this.$t('byok.field.baseUrlPlaceholder');
    }
  },
  watch: {
    credential: {
      immediate: true,
      handler(row: IBYOKCredential | null) {
        if (row) {
          this.form = {
            provider: row.provider,
            api_key: '',
            base_url: row.base_url ?? '',
            label: row.label ?? ''
          };
          this.advancedOpen = !!row.base_url;
        } else {
          this.form = {
            provider: this.providers?.[0]?.id ?? '',
            api_key: '',
            base_url: '',
            label: ''
          };
          this.advancedOpen = false;
        }
      }
    }
  },
  methods: {
    onClose(value?: boolean) {
      // ElDialog passes a boolean, ElButton passes a click event — only
      // respect explicit `false` (close).
      if (value === false || value === undefined) {
        this.$emit('update:visible', false);
      }
    },
    async onSubmit() {
      const formRef = this.$refs.formRef as FormInstance | undefined;
      if (formRef) {
        try {
          await formRef.validate();
        } catch {
          return;
        }
      }
      if (!this.token) return;
      this.saving = true;
      try {
        const baseUrl = this.form.base_url.trim();
        const label = this.form.label.trim();
        const apiKey = this.form.api_key.trim();
        if (this.credential) {
          // Edit — only send fields that changed (api_key omitted when blank).
          const patch: Record<string, unknown> = {};
          if (apiKey) patch.api_key = apiKey;
          if (baseUrl !== (this.credential.base_url ?? '')) patch.base_url = baseUrl;
          if (label !== (this.credential.label ?? '')) patch.label = label;
          if (Object.keys(patch).length === 0) {
            this.$emit('saved');
            return;
          }
          await byokCredentialOperator.update(this.credential.id, patch, { token: this.token });
        } else {
          if (!this.form.provider) return;
          const payload: IBYOKCredentialCreatePayload = {
            provider: this.form.provider,
            api_key: apiKey,
            ...(baseUrl ? { base_url: baseUrl } : {}),
            ...(label ? { label } : {})
          };
          await byokCredentialOperator.create(payload, { token: this.token });
        }
        ElMessage.success(this.$t('byok.message.saveSuccess'));
        this.$emit('saved');
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : 'unknown error');
        console.error('Failed to save BYOK credential', err);
        ElMessage.error(this.$t('byok.message.saveFailed') + ': ' + message);
      } finally {
        this.saving = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  margin: -6px 0 8px;
  &:hover {
    color: var(--el-color-primary);
  }
}

.advanced-section {
  border-left: 2px solid var(--el-border-color-lighter);
  padding-left: 12px;
}

.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin: 4px 0 0;
}

.w-full {
  width: 100%;
}
</style>
