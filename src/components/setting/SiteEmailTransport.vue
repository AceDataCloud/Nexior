<template>
  <section class="settings-item email-transport">
    <div class="settings-label">
      <p class="settings-title">{{ $t('site.field.authEmailTransport') }}</p>
      <p class="settings-tip">{{ $t('site.message.authEmailTransportTip') }}</p>
    </div>
    <div class="settings-content email-transport__content">
      <el-form label-position="top" class="email-transport__form">
        <el-form-item :label="$t('site.field.authEmailTransportSecurity')">
          <el-select v-model="draft.security" @change="onSecurityChange">
            <el-option value="starttls" :label="$t('site.option.authEmailTransportStarttls')" />
            <el-option value="implicit_tls" :label="$t('site.option.authEmailTransportImplicitTls')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportHost')">
          <el-input v-model="draft.host" placeholder="smtp.example.com" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportUsername')">
          <el-input v-model="draft.username" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportPassword')">
          <el-input
            v-model="draft.password"
            type="password"
            show-password
            :placeholder="$t('site.placeholder.authEmailTransportPassword')"
          />
          <span v-if="smtp?.password_configured" class="email-transport__hint">
            {{ $t('site.message.authEmailTransportPasswordConfigured') }}
          </span>
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportFromEmail')">
          <el-input v-model="draft.from_email" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportFromName')">
          <el-input v-model="draft.from_name" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportReplyTo')">
          <el-input v-model="draft.reply_to" />
        </el-form-item>
      </el-form>
      <el-alert
        v-if="resultMessage"
        :title="resultMessage"
        :type="resultOk ? 'success' : 'error'"
        :closable="false"
        show-icon
      />
      <div class="email-transport__actions">
        <el-button type="primary" :loading="saving" :disabled="!canSave" @click="save">
          {{ $t('site.button.authEmailTransportSave') }}
        </el-button>
        <el-button :loading="testing" :disabled="!smtp?.password_configured || dirty" @click="testTransport">
          {{ $t('site.button.authEmailTransportTest') }}
        </el-button>
        <el-button
          v-if="smtp && !smtp.enabled"
          type="success"
          :loading="changing"
          :disabled="dirty || (!testProof && !smtp.verified)"
          @click="enable"
        >
          {{ $t('site.button.authEmailTransportEnable') }}
        </el-button>
        <el-button v-if="smtp?.enabled" :loading="changing" @click="disable">
          {{ $t('site.button.authEmailTransportDisable') }}
        </el-button>
        <el-button v-if="smtp" type="danger" plain :loading="deleting" @click="remove">
          {{ $t('common.button.delete') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect
} from 'element-plus';
import type { ISiteAuth, ISiteAuthEmailSmtp, SiteEmailTransportSecurity } from '@/models/site';
import { siteEmailTransportOperator } from '@/operators/siteEmailTransport';

const emptyDraft = (): ISiteAuthEmailSmtp => ({
  enabled: false,
  host: '',
  port: 587,
  security: 'starttls',
  username: '',
  password: '',
  from_email: '',
  from_name: '',
  reply_to: ''
});

export default defineComponent({
  name: 'SiteEmailTransport',
  components: { ElAlert, ElButton, ElForm, ElFormItem, ElInput, ElOption, ElSelect },
  props: {
    siteId: { type: String as PropType<string>, required: true },
    auth: { type: Object as PropType<ISiteAuth>, required: true },
    saveAuth: { type: Function as PropType<(auth: ISiteAuth) => Promise<void>>, required: true }
  },
  data() {
    return {
      draft: emptyDraft(),
      savedSnapshot: '',
      saving: false,
      testing: false,
      changing: false,
      deleting: false,
      testProof: '',
      resultMessage: '',
      resultOk: false
    };
  },
  computed: {
    smtp(): ISiteAuthEmailSmtp | null {
      return this.auth.providers?.email?.smtp || null;
    },
    canSave(): boolean {
      return Boolean(
        this.dirty &&
        this.draft.host &&
        this.draft.username &&
        this.draft.from_email &&
        (this.draft.password || this.smtp?.password_configured)
      );
    },
    dirty(): boolean {
      return JSON.stringify(this.safeDraft()) !== this.savedSnapshot;
    }
  },
  watch: {
    smtp: {
      immediate: true,
      deep: true,
      handler(value: ISiteAuthEmailSmtp | null) {
        this.applySmtp(value);
      }
    }
  },
  methods: {
    safeDraft(): ISiteAuthEmailSmtp {
      const value = { ...this.draft };
      if (!value.password) delete value.password;
      return value;
    },
    applySmtp(smtp: ISiteAuthEmailSmtp | null) {
      this.draft = smtp ? { ...smtp, password: '' } : emptyDraft();
      this.savedSnapshot = JSON.stringify(this.safeDraft());
      this.testProof = '';
    },
    onSecurityChange(value: SiteEmailTransportSecurity) {
      this.draft.port = value === 'implicit_tls' ? 465 : 587;
    },
    async saveEmailSmtp(smtp: ISiteAuthEmailSmtp | null) {
      const providers = { ...(this.auth.providers || {}) };
      providers.email = { ...(providers.email || {}), smtp };
      await this.saveAuth({ ...this.auth, providers });
    },
    async save() {
      if (!this.canSave) return;
      this.saving = true;
      this.resultMessage = '';
      try {
        const saved = { ...this.safeDraft(), enabled: false, test_proof: undefined };
        await this.saveEmailSmtp(saved);
        this.draft.enabled = false;
        this.draft.password = '';
        this.testProof = '';
        this.savedSnapshot = JSON.stringify({ ...saved, password: undefined });
        ElMessage.success(this.$t('site.message.authEmailTransportSaved'));
      } catch {
        ElMessage.error(this.$t('site.error.authEmailTransportSave'));
      } finally {
        this.saving = false;
      }
    },
    async testTransport() {
      this.testing = true;
      this.resultMessage = '';
      try {
        const { data } = await siteEmailTransportOperator.test(this.siteId);
        this.resultOk = data.success;
        this.testProof = data.success ? data.test_proof || '' : '';
        this.resultMessage = data.success
          ? this.$t('site.message.authEmailTransportTestOk')
          : this.$t(`site.error.authEmailTransport_${data.code || 'unknown'}`);
      } catch (error: any) {
        const code = error?.response?.data?.code || 'unknown';
        this.resultOk = false;
        this.testProof = '';
        this.resultMessage = this.$t(`site.error.authEmailTransport_${code}`);
      } finally {
        this.testing = false;
      }
    },
    async enable() {
      if ((!this.testProof && !this.smtp?.verified) || this.dirty || !this.smtp) return;
      this.changing = true;
      try {
        await this.saveEmailSmtp({
          ...this.smtp,
          enabled: true,
          test_proof: this.testProof || undefined
        });
        this.testProof = '';
      } finally {
        this.changing = false;
      }
    },
    async disable() {
      if (!this.smtp) return;
      this.changing = true;
      try {
        await this.saveEmailSmtp({ ...this.smtp, enabled: false });
      } finally {
        this.changing = false;
      }
    },
    async remove() {
      try {
        await ElMessageBox.confirm(
          this.$t('site.message.authEmailTransportDeleteConfirm'),
          this.$t('site.field.authEmailTransportDeleteTitle'),
          { type: 'warning' }
        );
      } catch {
        return;
      }
      this.deleting = true;
      try {
        await this.saveEmailSmtp(null);
        this.applySmtp(null);
      } finally {
        this.deleting = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.email-transport__content {
  width: min(100%, 520px);
  align-items: stretch;
}
.email-transport__form {
  width: 100%;
}
.email-transport__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.email-transport__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 4px;
}
</style>
