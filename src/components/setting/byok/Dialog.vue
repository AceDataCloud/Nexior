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
          <el-option v-for="opt in providers" :key="opt.id" :label="opt.label" :value="opt.id">
            <div class="provider-option">
              <span class="provider-name">{{ opt.label }}</span>
              <span class="provider-desc">{{ providerDescription(opt.id) }}</span>
            </div>
          </el-option>
        </el-select>
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

      <el-form-item :label="$t('byok.field.baseUrl')" prop="base_url">
        <el-input v-model="form.base_url" :placeholder="placeholderBaseUrl" />
        <p class="hint">{{ $t('byok.message.baseUrlHelp') }}</p>
      </el-form-item>

      <el-form-item :label="$t('byok.field.label')">
        <el-input
          v-model="form.label"
          :placeholder="$t('byok.field.labelPlaceholder')"
          maxlength="64"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <div v-if="testResult" :class="['test-result', testResult.ok ? 'ok' : 'fail']">
      <p class="test-result-title">
        <span v-if="testResult.ok">✓ {{ $t('byok.test.success') }}</span>
        <span v-else>✗ {{ $t('byok.test.failure') }}</span>
      </p>
      <dl class="test-result-detail">
        <dt>{{ $t('byok.test.endpoint') }}</dt>
        <dd>
          <code>GET {{ testResult.endpoint }}</code>
        </dd>
        <template v-if="testResult.status !== undefined">
          <dt>{{ $t('byok.test.status') }}</dt>
          <dd>
            <code>{{ testResult.status }}</code>
          </dd>
        </template>
        <template v-if="testResult.message">
          <dt>{{ $t('byok.test.message') }}</dt>
          <dd>{{ testResult.message }}</dd>
        </template>
      </dl>
    </div>

    <template #footer>
      <el-button @click="onClose(false)">{{ $t('byok.button.cancel') }}</el-button>
      <el-button :loading="testing" :disabled="saving || !canTest" @click="onSaveAndTest">
        {{ $t('byok.button.testConnection') }}
      </el-button>
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
import { byokCredentialOperator } from '@/operators';
import type { IBYOKCredential, IBYOKCredentialCreatePayload, IBYOKProvider, IBYOKProviderInfo } from '@/models';

interface ITestResult {
  ok: boolean;
  /** Resolved upstream URL we hit (server-known default + custom base override). */
  endpoint: string;
  /** Upstream HTTP status, populated whenever the server saw one. */
  status?: number;
  message?: string;
}

export default defineComponent({
  name: 'BYOKDialog',
  components: {
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElOption,
    ElSelect
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
      saving: false,
      testing: false,
      testResult: null as ITestResult | null
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
    },
    /**
     * On edit, the row already has an api_key on the server, so the
     * test button can run even when the api_key field is left blank
     * (= "keep existing"). On create, we need a non-empty api_key
     * because the row doesn't exist yet and the test button needs to
     * save it first.
     */
    canTest(): boolean {
      if (!this.token) return false;
      if (!this.form.provider) return false;
      if (this.credential) return true;
      return !!this.form.api_key.trim();
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
        } else {
          this.form = {
            provider: this.providers?.[0]?.id ?? '',
            api_key: '',
            base_url: '',
            label: ''
          };
        }
        this.testResult = null;
      }
    }
  },
  methods: {
    providerDescription(id: IBYOKProvider): string {
      // Localized one-liner shown under each provider option in the
      // dropdown so the user knows what models the BYOK key will
      // override on the consumer-facing chat pages.
      return this.$t(`byok.providerDesc.${id}`);
    },
    onClose(value?: boolean) {
      // ElDialog passes a boolean, ElButton passes a click event — only
      // respect explicit `false` (close).
      if (value === false || value === undefined) {
        this.$emit('update:visible', false);
      }
    },
    /**
     * Persist the row (create or update). Returns the row's id on
     * success so the caller can chain `test`. Returns null on
     * validation / network failure (caller surfaces the error toast).
     */
    async persist(options: { silent?: boolean } = {}): Promise<string | null> {
      const formRef = this.$refs.formRef as FormInstance | undefined;
      if (formRef) {
        try {
          await formRef.validate();
        } catch {
          return null;
        }
      }
      if (!this.token) return null;
      this.saving = true;
      try {
        const baseUrl = this.form.base_url.trim();
        const label = this.form.label.trim();
        const apiKey = this.form.api_key.trim();
        if (this.credential) {
          const patch: Record<string, unknown> = {};
          if (apiKey) patch.api_key = apiKey;
          if (baseUrl !== (this.credential.base_url ?? '')) patch.base_url = baseUrl;
          if (label !== (this.credential.label ?? '')) patch.label = label;
          if (Object.keys(patch).length > 0) {
            await byokCredentialOperator.update(this.credential.id, patch, { token: this.token });
          }
          if (!options.silent) ElMessage.success(this.$t('byok.message.saveSuccess'));
          return this.credential.id;
        }
        if (!this.form.provider) return null;
        const payload: IBYOKCredentialCreatePayload = {
          provider: this.form.provider,
          api_key: apiKey,
          ...(baseUrl ? { base_url: baseUrl } : {}),
          ...(label ? { label } : {})
        };
        const { data } = await byokCredentialOperator.create(payload, { token: this.token });
        if (!options.silent) ElMessage.success(this.$t('byok.message.saveSuccess'));
        return data?.id ?? null;
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : 'unknown error');
        console.error('Failed to save BYOK credential', err);
        ElMessage.error(this.$t('byok.message.saveFailed') + ': ' + message);
        return null;
      } finally {
        this.saving = false;
      }
    },
    async onSubmit() {
      const id = await this.persist();
      if (id) this.$emit('saved');
    },
    async onSaveAndTest() {
      this.testResult = null;
      // Save first so the test runs against exactly the config the
      // user entered (api_key + base_url + provider) and reuses the
      // existing `POST /aichat2/credentials {action: 'test'}` endpoint
      // — there's no anonymous dry-run endpoint server-side.
      const id = await this.persist({ silent: true });
      if (!id) return;
      const provider = this.providers.find((p) => p.id === this.form.provider);
      const baseUrl = (this.form.base_url || provider?.default_base_url || '').replace(/\/+$/, '');
      const endpoint = `${baseUrl}/models`;
      this.testing = true;
      try {
        const { data } = await byokCredentialOperator.test(id, { token: this.token });
        this.testResult = {
          ok: !!data?.ok,
          endpoint,
          status: data?.status,
          message: data?.message
        };
        // The list view re-pulls credentials via the parent `saved`
        // emit — `last_used_at` updates after a successful test.
        this.$emit('saved');
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : 'unknown error');
        this.testResult = {
          ok: false,
          endpoint,
          status,
          message
        };
      } finally {
        this.testing = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin: 4px 0 0;
}

.w-full {
  width: 100%;
}

.provider-option {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  padding: 4px 0;
  gap: 2px;
}

.provider-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.provider-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.test-result {
  margin: 4px 0 0;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 13px;
  line-height: 1.5;

  &.ok {
    background: var(--el-color-success-light-9, #f0f9eb);
    border-color: var(--el-color-success-light-7, #b3e19d);
    color: var(--el-color-success-dark-2, #5daf34);
  }

  &.fail {
    background: var(--el-color-danger-light-9, #fef0f0);
    border-color: var(--el-color-danger-light-7, #fab6b6);
    color: var(--el-color-danger-dark-2, #b94343);
  }
}

.test-result-title {
  margin: 0 0 6px;
  font-weight: 600;
}

.test-result-detail {
  display: grid;
  grid-template-columns: minmax(72px, max-content) 1fr;
  column-gap: 12px;
  row-gap: 4px;
  margin: 0;

  dt {
    color: var(--el-text-color-regular);
    font-weight: 500;
  }

  dd {
    margin: 0;
    word-break: break-all;
    color: var(--el-text-color-primary);
  }

  code {
    font-size: 12px;
    background: rgba(0, 0, 0, 0.04);
    padding: 1px 6px;
    border-radius: 4px;
  }
}
</style>
