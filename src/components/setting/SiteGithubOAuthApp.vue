<template>
  <section class="settings-item github-oauth">
    <div class="settings-label">
      <p class="settings-title">{{ $t('site.field.authGithubOAuthApp') }}</p>
      <p class="settings-tip">{{ $t('site.message.authGithubOAuthAppTip') }}</p>
    </div>
    <div class="settings-content github-oauth__content">
      <el-alert
        v-if="!providerEnabled"
        :title="$t('site.message.authGithubOAuthProviderDisabled')"
        type="info"
        :closable="false"
      />
      <el-alert
        :title="
          usingPlatformDefault
            ? $t('site.message.authGithubOAuthUsingPlatform')
            : $t('site.message.authGithubOAuthUsingCustom')
        "
        :type="usingPlatformDefault ? 'info' : 'success'"
        :closable="false"
      />
      <el-form label-position="top" class="github-oauth__form">
        <el-form-item :label="$t('site.field.authGithubOAuthClientId')">
          <el-input v-model.trim="draft.clientId" autocomplete="off" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authGithubOAuthClientSecret')">
          <el-input
            v-model="draft.clientSecret"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="$t('site.placeholder.authGithubOAuthClientSecret')"
          />
          <span v-if="configured" class="github-oauth__hint">
            {{ $t('site.message.authGithubOAuthSecretConfigured') }}
          </span>
        </el-form-item>
        <el-form-item :label="$t('site.field.authGithubOAuthCallbackUrl')">
          <div class="github-oauth__callback">
            <el-input :model-value="callbackUrl" readonly />
            <copy-to-clipboard :content="callbackUrl" />
          </div>
          <span class="github-oauth__hint">{{ $t('site.message.authGithubOAuthCallbackTip') }}</span>
        </el-form-item>
      </el-form>
      <div class="github-oauth__actions">
        <el-button type="primary" :disabled="!canSave" @click="save">
          {{ $t('common.button.save') }}
        </el-button>
        <el-button v-if="!usingPlatformDefault" type="danger" plain @click="reset">
          {{ $t('site.button.authGithubOAuthRestoreDefault') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessageBox } from 'element-plus';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { getBaseUrlAuth } from '@/utils';

const CALLBACK_URL = `${getBaseUrlAuth().replace(/\/$/, '')}/oauth/callback/github`;
export interface GithubCredentialsDraft {
  mode: 'platform' | 'custom';
  config?: { client_id: string };
  secret_values?: { client_secret: string };
}

export default defineComponent({
  name: 'SiteGithubOAuthApp',
  components: { CopyToClipboard, ElAlert, ElButton, ElForm, ElFormItem, ElInput },
  props: {
    credentials: { type: Object, default: () => ({ mode: 'platform' }) },
    providerEnabled: { type: Boolean, required: true }
  },
  emits: ['change'],
  data() {
    const credentials = this.credentials as any;
    return {
      draft: { clientId: credentials.config?.client_id || '', clientSecret: '' },
      callbackUrl: CALLBACK_URL,
      mode: credentials.mode === 'custom' ? 'custom' : 'platform'
    };
  },
  computed: {
    configured(): boolean {
      return Boolean((this.credentials as any).secret_status?.client_secret?.configured);
    },
    usingPlatformDefault(): boolean {
      return this.mode === 'platform';
    },
    canSave(): boolean {
      return Boolean(this.draft.clientId && (this.draft.clientSecret || this.configured));
    }
  },
  methods: {
    save(): void {
      if (!this.canSave) return;
      this.mode = 'custom';
      this.$emit('change', {
        mode: 'custom',
        config: { client_id: this.draft.clientId },
        ...(this.draft.clientSecret ? { secret_values: { client_secret: this.draft.clientSecret } } : {})
      } as GithubCredentialsDraft);
      this.draft.clientSecret = '';
    },
    async reset(): Promise<void> {
      try {
        await ElMessageBox.confirm(
          this.$t('site.message.authGithubOAuthDeleteConfirm'),
          this.$t('site.field.authGithubOAuthDeleteTitle'),
          { type: 'warning' }
        );
      } catch {
        return;
      }
      this.mode = 'platform';
      this.draft = { clientId: '', clientSecret: '' };
      this.$emit('change', { mode: 'platform' } as GithubCredentialsDraft);
    }
  }
});
</script>

<style lang="scss" scoped>
.github-oauth__content,
.github-oauth__form {
  display: flex;
  width: 100%;
  max-width: 420px;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  text-align: left;
}
.github-oauth__callback {
  display: flex;
  width: 100%;
  gap: 8px;
}
.github-oauth__hint {
  display: block;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.github-oauth__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@container auth-settings (max-width: 560px) {
  .github-oauth__actions .el-button {
    flex: 1 1 auto;
    margin-left: 0;
  }
}
</style>
