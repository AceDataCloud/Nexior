<template>
  <section class="settings-item site-oauth-app">
    <div class="settings-label">
      <p class="settings-title">{{ $t(descriptor.titleKey) }}</p>
      <p class="settings-tip">{{ $t(descriptor.tipKey) }}</p>
    </div>
    <div class="settings-content site-oauth-app__content">
      <el-alert v-if="!providerEnabled" :title="$t(descriptor.disabledKey)" type="info" :closable="false" />
      <el-switch :model-value="customVisible" :aria-label="$t(descriptor.titleKey)" @change="toggleCustomApp" />
      <el-alert
        :title="$t(usingPlatformDefault ? descriptor.usingPlatformKey : descriptor.usingCustomKey)"
        :type="usingPlatformDefault ? 'info' : 'success'"
        :closable="false"
      />
      <el-form v-if="customVisible" label-position="top" class="site-oauth-app__form">
        <el-form-item :label="$t(descriptor.clientIdKey)">
          <el-input v-model.trim="draft.clientId" autocomplete="off" />
        </el-form-item>
        <el-form-item v-if="descriptor.requiresSecret" :label="$t(descriptor.clientSecretKey!)">
          <el-input
            v-model="draft.clientSecret"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="$t(descriptor.clientSecretPlaceholderKey!)"
          />
          <span v-if="configured" class="site-oauth-app__hint">
            {{ $t(descriptor.secretConfiguredKey!) }}
          </span>
        </el-form-item>
        <el-form-item :label="$t(descriptor.callbackUrlKey)">
          <div class="site-oauth-app__callback">
            <el-input :model-value="callbackUrl" readonly />
            <copy-to-clipboard :content="callbackUrl" />
          </div>
          <span class="site-oauth-app__hint">{{ $t(descriptor.callbackTipKey) }}</span>
        </el-form-item>
      </el-form>
      <div v-if="customVisible" class="site-oauth-app__actions">
        <el-button type="primary" :loading="saving" :disabled="!canSave || saving" @click="save">
          {{ $t('common.button.save') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessageBox, ElSwitch } from 'element-plus';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { getBaseUrlAuth } from '@/utils';
import type { ISiteOAuthCredentials, SiteOAuthCredentialsDraft } from '@/models';
import type { SiteOAuthProviderDescriptor } from '@/constants/siteOAuthProviders';

export default defineComponent({
  name: 'SiteOAuthAppEditor',
  components: { CopyToClipboard, ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElSwitch },
  props: {
    descriptor: { type: Object as PropType<SiteOAuthProviderDescriptor>, required: true },
    credentials: {
      type: Object as PropType<ISiteOAuthCredentials>,
      default: () => ({ mode: 'platform' })
    },
    providerEnabled: { type: Boolean, required: true },
    saving: { type: Boolean, default: false }
  },
  emits: ['change'],
  data() {
    return {
      draft: { clientId: '', clientSecret: '' },
      mode: 'platform' as 'platform' | 'custom',
      loadedMode: 'platform' as 'platform' | 'custom',
      loadedClientId: '',
      pendingSave: undefined as { mode: 'platform' | 'custom'; clientId: string } | undefined,
      configuring: false
    };
  },
  computed: {
    callbackUrl(): string {
      const path = this.credentials.callback?.path || this.descriptor.callbackPath;
      return `${getBaseUrlAuth().replace(/\/$/, '')}${path}`;
    },
    configured(): boolean {
      return Boolean(this.credentials.secret_status?.client_secret?.configured);
    },
    usingPlatformDefault(): boolean {
      return this.mode === 'platform';
    },
    customVisible(): boolean {
      return this.mode === 'custom' || this.configuring;
    },
    canSave(): boolean {
      if (!this.draft.clientId) return false;
      if (!this.descriptor.requiresSecret) return true;
      const canReuseSecret = this.configured && this.draft.clientId === this.loadedClientId;
      return Boolean(this.draft.clientSecret || canReuseSecret);
    }
  },
  watch: {
    credentials: {
      immediate: true,
      deep: true,
      handler(value: ISiteOAuthCredentials) {
        this.syncCredentials(value);
      }
    }
  },
  methods: {
    syncCredentials(value?: ISiteOAuthCredentials): void {
      const credentials = value || { mode: 'platform' };
      const mode = credentials.mode === 'custom' ? 'custom' : 'platform';
      const clientId = credentials.config?.client_id || '';
      const pendingSaved = this.pendingSave?.mode === mode && this.pendingSave.clientId === clientId;
      const hasDraft =
        Boolean(this.pendingSave) ||
        this.configuring ||
        Boolean(this.draft.clientSecret) ||
        this.mode !== this.loadedMode ||
        this.draft.clientId !== this.loadedClientId;
      if (hasDraft && !pendingSaved) return;
      this.mode = mode;
      this.loadedMode = mode;
      this.loadedClientId = clientId;
      this.pendingSave = undefined;
      this.draft = { clientId, clientSecret: '' };
      this.configuring = false;
    },
    save(): void {
      if (!this.canSave) return;
      this.mode = 'custom';
      this.pendingSave = { mode: 'custom', clientId: this.draft.clientId };
      const credentials: SiteOAuthCredentialsDraft = {
        mode: 'custom',
        config: { client_id: this.draft.clientId },
        ...(this.descriptor.requiresSecret && this.draft.clientSecret
          ? { secret_values: { client_secret: this.draft.clientSecret } }
          : {})
      };
      this.$emit('change', credentials);
    },
    async toggleCustomApp(value: string | number | boolean): Promise<void> {
      if (value === true) {
        this.configuring = true;
        return;
      }
      if (this.mode === 'platform') {
        this.configuring = false;
        this.draft = { clientId: '', clientSecret: '' };
        return;
      }
      try {
        await ElMessageBox.confirm(this.$t(this.descriptor.deleteConfirmKey), this.$t(this.descriptor.deleteTitleKey), {
          type: 'warning'
        });
      } catch {
        return;
      }
      this.pendingSave = { mode: 'platform', clientId: '' };
      this.$emit('change', { mode: 'platform' } as SiteOAuthCredentialsDraft);
    }
  }
});
</script>

<style lang="scss" scoped>
.site-oauth-app__content,
.site-oauth-app__form {
  display: flex;
  width: 100%;
  max-width: 420px;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  text-align: left;
}
.site-oauth-app__callback {
  display: flex;
  width: 100%;
  gap: 8px;
}
.site-oauth-app__hint {
  display: block;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.site-oauth-app__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@container auth-settings (max-width: 560px) {
  .site-oauth-app__actions .el-button {
    flex: 1 1 auto;
    margin-left: 0;
  }
}
</style>
