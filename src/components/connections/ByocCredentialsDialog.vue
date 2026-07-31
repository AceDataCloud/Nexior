<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="min(520px, 94vw)"
    append-to-body
    destroy-on-close
    @close="onClose"
  >
    <!-- Extension cookie-capture path (metadata.credential_source === 'extension') -->
    <template v-if="isExtension">
      <!-- A) extension not detected → install guidance -->
      <div v-if="!extensionReady" class="byoc-missing">
        <warning-icon class="byoc-missing-icon" size="1em" aria-hidden="true" focusable="false" />
        <div class="byoc-missing-body">
          <p class="byoc-missing-title">{{ $t('connection.byoc.extensionMissingTitle') }}</p>
          <p class="byoc-missing-text">{{ $t('connection.byoc.extensionMissingBody') }}</p>
          <a class="byoc-doc-link" :href="ACE_EXTENSION_DOC" target="_blank" rel="noopener">
            {{ $t('connection.byoc.extensionGuide') }} →
          </a>
        </div>
      </div>

      <!-- B) extension detected → one-click capture, no input box -->
      <template v-else>
        <p class="byoc-intro">{{ $t('connection.byoc.extensionIntro') }}</p>
        <a class="byoc-doc-link byoc-doc-link-inline" :href="ACE_EXTENSION_DOC" target="_blank" rel="noopener">
          {{ $t('connection.byoc.extensionGuide') }} →
        </a>
        <ol class="byoc-steps">
          <li>
            {{ $t('connection.byoc.extensionStepLogin') }}
            <el-button v-if="loginUrl" link type="primary" @click="openLogin">
              {{ $t('connection.byoc.extensionOpenLogin') }}
            </el-button>
          </li>
          <li>{{ $t('connection.byoc.extensionStepCapture') }}</li>
        </ol>
        <p class="byoc-disclaimer">
          <security-icon class="byoc-shield" :size="16" aria-hidden="true" focusable="false" />
          {{ $t('connection.byoc.disclaimer') }}
        </p>
      </template>
    </template>

    <!-- Standard BYOC form path (paste keys) -->
    <template v-else>
      <p v-if="schema.length > 0" class="byoc-intro">
        {{ $t('connection.byoc.intro') }}
      </p>

      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-position="top"
        class="byoc-form"
        @submit.prevent
      >
        <el-form-item v-for="field in schema" :key="field.key" :label="field.label" :prop="field.key">
          <el-select
            v-if="field.type === 'select'"
            v-model="formModel[field.key]"
            :placeholder="field.help || ''"
            filterable
            class="byoc-input"
          >
            <el-option v-for="opt in field.options || []" :key="opt" :label="opt" :value="opt" />
          </el-select>
          <el-input
            v-else
            v-model="formModel[field.key]"
            :type="isSecret(field) ? 'password' : 'text'"
            :show-password="isSecret(field)"
            :placeholder="field.help || ''"
            :autocomplete="isSecret(field) ? 'new-password' : 'off'"
            class="byoc-input"
          />
          <div v-if="field.help" class="byoc-help">{{ field.help }}</div>
        </el-form-item>
      </el-form>

      <p class="byoc-disclaimer">
        <security-icon class="byoc-shield" :size="16" aria-hidden="true" focusable="false" />
        {{ $t('connection.byoc.disclaimer') }}
      </p>
    </template>

    <template #footer>
      <el-button @click="onClose">{{ $t('common.button.cancel') }}</el-button>
      <template v-if="isExtension">
        <el-button v-if="!extensionReady" type="primary" :loading="detecting" @click="recheckExtension">
          {{ $t('connection.byoc.extensionRecheck') }}
        </el-button>
        <el-button v-else type="primary" :loading="submitting" @click="onCapture">
          {{ $t('connection.byoc.extensionCapture') }}
        </el-button>
      </template>
      <el-button v-else type="primary" :loading="submitting" @click="onSubmit">
        {{ $t('connection.byoc.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { SecurityIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import {
  IConnectorConnectionMethod,
  IConnectorCatalogItem,
  IConnectorCredentialField,
  connectionOperator,
  resolveConnectorMethod
} from '@/operators/connection';

interface IData {
  visible: boolean;
  submitting: boolean;
  detecting: boolean;
  extensionReady: boolean;
  formModel: Record<string, string>;
}

/** Shape posted back by the ACE extension content script. */
interface IExtensionCookieResponse {
  from?: string;
  action?: string;
  cookies?: Array<Record<string, unknown>>;
  error?: string;
}

// How long to wait for the extension to answer before assuming it isn't installed.
const CAPTURE_TIMEOUT_MS = 10000;
// ACE extension setup / install guide.
const ACE_EXTENSION_DOC = 'https://platform.acedata.cloud/documents/acedataext';

// DRF returns ``detail`` as either a plain string or a nested object of field
// errors, e.g. ``{payload: {cookies: ["Not a valid string."]}}``. Passing that
// object straight to ElMessage renders nothing, so flatten it to readable text.
function formatErrorDetail(detail: unknown): string {
  if (detail === null || detail === undefined) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(formatErrorDetail).filter(Boolean).join('; ');
  if (typeof detail === 'object') {
    return Object.values(detail as Record<string, unknown>)
      .map(formatErrorDetail)
      .filter(Boolean)
      .join('; ');
  }
  return String(detail);
}

export default defineComponent({
  name: 'ByocCredentialsDialog',
  components: { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, SecurityIcon, WarningIcon },
  props: {
    modelValue: { type: Boolean as PropType<boolean>, default: false },
    /** The connector catalog row whose credentials we're collecting.
     *  Carries the id and display name. ``null`` is fine while the
     *  dialog is hidden so the parent can reuse a single instance
     *  across multiple connector cards. */
    item: { type: Object as PropType<IConnectorCatalogItem | null>, default: null },
    /** The specific connection method the user chose (credential schema,
     *  cookie domains, login url all come from here). When ``null`` the
     *  dialog falls back to the item's recommended method — the common
     *  single-method case. */
    method: { type: Object as PropType<IConnectorConnectionMethod | null>, default: null },
    /** Add another account of this connector instead of replacing the one
     *  already connected. Only set by the "Add account" entry point. */
    createNew: { type: Boolean as PropType<boolean>, default: false }
  },
  emits: ['update:modelValue', 'installed'],
  data(): IData {
    return {
      visible: this.modelValue,
      submitting: false,
      detecting: false,
      extensionReady: false,
      formModel: {}
    };
  },
  computed: {
    /** The effective method whose fields drive this dialog. Explicit
     *  ``method`` prop wins; otherwise resolve the item's recommended
     *  method. */
    activeMethod(): IConnectorConnectionMethod | null {
      if (this.method) return this.method;
      return resolveConnectorMethod(this.item) || null;
    },
    /** The schema is empty for methods that do not collect credentials. The parent
     *  should never open this dialog for those, but be defensive. */
    schema(): IConnectorCredentialField[] {
      return this.activeMethod?.credential.credential_schema || [];
    },
    /** Cookie connectors are captured by the ACE browser extension
     *  instead of a paste form. */
    isExtension(): boolean {
      return this.activeMethod?.credential.source === 'extension';
    },
    ACE_EXTENSION_DOC(): string {
      return ACE_EXTENSION_DOC;
    },
    loginUrl(): string {
      return this.activeMethod?.credential.login_url || '';
    },
    /** Primary cookie domain to capture (extension matches subdomains). */
    captureDomain(): string {
      const domains = this.activeMethod?.credential.cookie_domains || [];
      return (domains[0] || '').replace(/^\./, '');
    },
    dialogTitle(): string {
      const name = this.item?.name || '';
      return this.$t('connection.byoc.dialogTitle', { name }) as string;
    },
    formRules(): FormRules {
      const rules: FormRules = {};
      const requiredMsg = this.$t('connection.byoc.required') as string;
      for (const field of this.schema) {
        if (!field.required) continue;
        rules[field.key] = [{ required: true, message: requiredMsg, trigger: 'blur' }];
      }
      return rules;
    }
  },
  watch: {
    modelValue(v: boolean) {
      this.visible = v;
      if (v) {
        this.resetForm();
        // Content scripts inject ~after page load, so poll briefly on open.
        if (this.isExtension) this.pollDetect(8);
      }
    },
    visible(v: boolean) {
      this.$emit('update:modelValue', v);
    }
  },
  methods: {
    /** Treat ``type=password`` AND explicit ``secret: true`` as
     *  secrets — keeps the schema author from forgetting to flag a
     *  password field as a secret. */
    isSecret(field: IConnectorCredentialField): boolean {
      return field.type === 'password' || !!field.secret;
    },
    resetForm() {
      const next: Record<string, string> = {};
      for (const field of this.schema) {
        // Pre-fill from declared default; never pre-fill secrets even
        // if a default was set (defaults exist for region selectors,
        // not API keys).
        if (field.default && !this.isSecret(field)) {
          next[field.key] = field.default;
        } else {
          next[field.key] = '';
        }
      }
      this.formModel = next;
    },
    onClose() {
      // Hard-clear form state on close so reopening for another
      // connector doesn't leak previous keystrokes — especially the
      // secret fields.
      this.formModel = {};
      this.visible = false;
    },
    openLogin() {
      if (this.loginUrl) window.open(this.loginUrl, '_blank', 'noopener');
    },
    /** The ACE extension content script injects a ``#acedataext`` marker on
     *  this page when installed — presence = installed. */
    detectExtension(): boolean {
      this.extensionReady = !!document.getElementById('acedataext');
      return this.extensionReady;
    },
    /** Poll a few times on open (the content script injects shortly after load). */
    pollDetect(attempts: number) {
      if (this.detectExtension() || attempts <= 0) return;
      window.setTimeout(() => this.pollDetect(attempts - 1), 400);
    },
    /** Manual re-check after the user installs the extension. */
    recheckExtension() {
      this.detecting = true;
      window.setTimeout(() => {
        this.detectExtension();
        this.detecting = false;
        if (!this.extensionReady) {
          ElMessage.warning(this.$t('connection.byoc.extensionMissing') as string);
        }
      }, 300);
    },
    /** Ask the ACE extension content script (injected on this page) to
     *  read the platform's cookie jar via chrome.cookies.getAll, then
     *  store it as the connector's BYOC credential. */
    captureCookies(): Promise<Array<Record<string, unknown>>> {
      return new Promise((resolve, reject) => {
        // The content script injects this marker element when present.
        if (!document.getElementById('acedataext')) {
          reject(new Error('extension-missing'));
          return;
        }
        let settled = false;
        const onMessage = (event: MessageEvent) => {
          const data = event.data as IExtensionCookieResponse;
          if (!data || data.from !== 'EXTENSION' || data.action !== 'getCookies') return;
          settled = true;
          window.removeEventListener('message', onMessage);
          window.clearTimeout(timer);
          if (data.error) reject(new Error(data.error));
          else resolve(data.cookies || []);
        };
        const timer = window.setTimeout(() => {
          if (settled) return;
          window.removeEventListener('message', onMessage);
          reject(new Error('extension-missing'));
        }, CAPTURE_TIMEOUT_MS);
        window.addEventListener('message', onMessage);
        window.postMessage(
          { action: 'getCookies', from: 'PAGE', domain: this.captureDomain, name: this.item?.slug },
          '*'
        );
      });
    },
    async onCapture() {
      if (!this.item) return;
      this.submitting = true;
      try {
        const cookies = await this.captureCookies();
        if (!cookies.length) {
          ElMessage.error(this.$t('connection.byoc.extensionNoCookies') as string);
          return;
        }
        const { data } = await connectionOperator.submitCatalogCredentials(this.item.id, {
          payload: { cookies },
          method_id: this.activeMethod?.id,
          ...(this.createNew ? { create_new: true } : {})
        });
        ElMessage.success(this.$t('connection.message.installed', { name: this.item.name }) as string);
        this.$emit('installed', { item: this.item, connection_id: data.connection_id });
        this.onClose();
      } catch (error: any) {
        if (error?.message === 'extension-missing') {
          ElMessage.error(this.$t('connection.byoc.extensionMissing') as string);
        } else {
          const detail = formatErrorDetail(error?.response?.data?.detail);
          ElMessage.error(detail || (this.$t('connection.message.installFailed') as string));
        }
      } finally {
        this.submitting = false;
      }
    },
    async onSubmit() {
      if (!this.item) return;
      const formRef = this.$refs.formRef as FormInstance | undefined;
      if (formRef) {
        const valid = await formRef.validate().catch(() => false);
        if (!valid) return;
      }
      this.submitting = true;
      try {
        const { data } = await connectionOperator.submitCatalogCredentials(this.item.id, {
          // Trim every field — leading/trailing whitespace in a
          // SecretId/SecretKey is almost always a paste artifact and
          // would silently break signed requests.
          payload: Object.fromEntries(Object.entries(this.formModel).map(([k, v]) => [k, (v ?? '').trim()])),
          method_id: this.activeMethod?.id,
          ...(this.createNew ? { create_new: true } : {})
        });
        ElMessage.success(this.$t('connection.message.installed', { name: this.item.name }) as string);
        this.$emit('installed', { item: this.item, connection_id: data.connection_id });
        this.onClose();
      } catch (error: any) {
        // The backend never echoes the payload back in error
        // messages (see app.views.connector_catalog.credentials), so
        // this detail is safe to render verbatim.
        const detail = formatErrorDetail(error?.response?.data?.detail);
        ElMessage.error(detail || (this.$t('connection.message.installFailed') as string));
      } finally {
        this.submitting = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.byoc-intro {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.byoc-steps {
  margin: 0 0 16px;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.9;
  color: var(--el-text-color-primary);
}

.byoc-form {
  // Override the dialog's natural narrow look — the credential
  // fields need room to fully show pasted Secret values.
  margin: 0;
}

.byoc-input {
  width: 100%;
}

.byoc-help {
  // Element Plus puts a 4px gap above; reset and use our own.
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.byoc-disclaimer {
  margin: 8px 0 0;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.byoc-shield {
  color: var(--el-color-success);
  margin-top: 2px;
  flex-shrink: 0;
}

.byoc-missing {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 8px;
}

.byoc-missing-icon {
  color: var(--el-color-warning);
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.byoc-missing-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.byoc-missing-text {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.byoc-doc-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-color-primary);
  text-decoration: none;
}

.byoc-doc-link-inline {
  display: inline-block;
  margin: -8px 0 12px;
}
</style>
