<template>
  <section class="settings-item github-oauth">
    <div class="settings-label">
      <p class="settings-title">{{ $t('site.field.authGithubOAuthApp') }}</p>
      <p class="settings-tip">{{ $t('site.message.authGithubOAuthAppTip') }}</p>
    </div>
    <div v-loading="loading" class="settings-content github-oauth__content">
      <el-alert
        v-if="!providerEnabled"
        :title="$t('site.message.authGithubOAuthProviderDisabled')"
        type="info"
        :closable="false"
      />
      <el-alert
        :title="
          config.using_platform_default
            ? $t('site.message.authGithubOAuthUsingPlatform')
            : $t('site.message.authGithubOAuthUsingCustom')
        "
        :type="config.using_platform_default ? 'info' : 'success'"
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
          <span v-if="config.client_secret_configured" class="github-oauth__hint">
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
        <el-button type="primary" :loading="saving" :disabled="!canSave" @click="save">
          {{ $t('common.button.save') }}
        </el-button>
        <el-button v-if="!config.using_platform_default" type="danger" plain :loading="deleting" @click="reset">
          {{ $t('site.button.authGithubOAuthRestoreDefault') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox } from 'element-plus';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { getBaseUrlAuth } from '@/utils';
import { type ISiteGithubOAuthApp, siteGithubOAuthOperator } from '@/operators/siteGithubOAuth';

const CALLBACK_URL = `${getBaseUrlAuth().replace(/\/$/, '')}/oauth/callback/github`;
const emptyConfig = (): ISiteGithubOAuthApp => ({
  client_id: null,
  client_secret_configured: false,
  using_platform_default: true
});

export default defineComponent({
  name: 'SiteGithubOAuthApp',
  components: { CopyToClipboard, ElAlert, ElButton, ElForm, ElFormItem, ElInput },
  props: {
    siteId: { type: String, required: true },
    providerEnabled: { type: Boolean, required: true }
  },
  data() {
    return {
      config: emptyConfig(),
      draft: { clientId: '', clientSecret: '' },
      callbackUrl: CALLBACK_URL,
      loading: false,
      saving: false,
      deleting: false
    };
  },
  computed: {
    canSave(): boolean {
      return Boolean(!this.loading && !this.saving && this.draft.clientId && this.draft.clientSecret);
    }
  },
  async mounted() {
    await this.load();
  },
  methods: {
    apply(config: ISiteGithubOAuthApp): void {
      this.config = config;
      this.draft = { clientId: config.client_id || '', clientSecret: '' };
    },
    async load(): Promise<void> {
      this.loading = true;
      try {
        const { data } = await siteGithubOAuthOperator.get(this.siteId);
        this.apply(data);
      } catch {
        ElMessage.error(this.$t('site.error.authGithubOAuthLoad'));
      } finally {
        this.loading = false;
      }
    },
    async save(): Promise<void> {
      if (!this.canSave) return;
      this.saving = true;
      try {
        const payload = {
          client_id: this.draft.clientId,
          ...(this.draft.clientSecret ? { client_secret: this.draft.clientSecret } : {})
        };
        const { data } = await siteGithubOAuthOperator.update(this.siteId, payload);
        this.apply(data);
        ElMessage.success(this.$t('site.message.authGithubOAuthSaved'));
      } catch {
        ElMessage.error(this.$t('site.error.authGithubOAuthSave'));
      } finally {
        this.saving = false;
      }
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
      this.deleting = true;
      try {
        await siteGithubOAuthOperator.remove(this.siteId);
        this.apply(emptyConfig());
        ElMessage.success(this.$t('site.message.authGithubOAuthDeleted'));
      } catch {
        ElMessage.error(this.$t('site.error.authGithubOAuthDelete'));
      } finally {
        this.deleting = false;
      }
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
