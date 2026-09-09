<template>
  <section class="settings-item email-delivery">
    <div class="settings-label">
      <p class="settings-title">{{ $t('site.field.authEmailTransport') }}</p>
      <p class="settings-tip">{{ $t('site.message.authEmailTransportTip') }}</p>
    </div>
    <div class="settings-content email-delivery__content">
      <el-alert
        v-if="!providerEnabled"
        :title="$t('site.message.authDeliveryProviderDisabled')"
        type="info"
        :closable="false"
      />
      <el-switch
        :model-value="active"
        :loading="changing"
        :disabled="loading || saving || deleting"
        :aria-label="$t('site.option.authEmailDeliverySmtp')"
        @change="toggleDelivery"
      />
      <el-alert
        v-if="smtp?.verification_source === 'legacy_migration'"
        :title="$t('site.message.authDeliveryMigrated')"
        type="warning"
        :closable="false"
      />
      <el-form label-position="top" class="email-delivery__form">
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
          <el-input v-model="draft.password" type="password" show-password />
          <span v-if="smtp?.password_configured" class="email-delivery__hint">
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
      <el-alert v-if="resultMessage" :title="resultMessage" :type="resultOk ? 'success' : 'error'" :closable="false" />
      <div class="email-delivery__actions">
        <el-button type="primary" :loading="saving" :disabled="!canSave || changing" @click="saveDraft">
          {{ $t('site.button.authEmailTransportSave') }}
        </el-button>
        <el-button :loading="testing" :disabled="!smtp?.password_configured || dirty || changing" @click="testDelivery">
          {{ $t('site.button.authEmailTransportTest') }}
        </el-button>
        <el-button v-if="!active && smtp" type="danger" plain :loading="deleting" :disabled="changing" @click="remove">
          {{ $t('common.button.delete') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch
} from 'element-plus';
import type { ISiteAuthDelivery, ISiteAuthEmailSmtp, SiteEmailTransportSecurity } from '@/models/site';
import { siteAuthDeliveryOperator } from '@/operators/siteAuthDelivery';

const emptySmtp = (): ISiteAuthEmailSmtp => ({
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
  components: {
    ElAlert,
    ElButton,
    ElForm,
    ElFormItem,
    ElInput,
    ElOption,
    ElSelect,
    ElSwitch
  },
  props: {
    siteId: { type: String, required: true },
    providerEnabled: { type: Boolean, required: true }
  },
  data() {
    return {
      delivery: { type: 'platform' } as ISiteAuthDelivery,
      draft: emptySmtp(),
      savedSnapshot: '',
      testProof: '',
      resultMessage: '',
      resultOk: false,
      loading: false,
      saving: false,
      testing: false,
      changing: false,
      deleting: false
    };
  },
  computed: {
    smtp(): ISiteAuthEmailSmtp | null {
      return this.delivery.smtp || null;
    },
    active(): boolean {
      return this.delivery.type === 'smtp';
    },
    dirty(): boolean {
      return JSON.stringify(this.safeDraft()) !== this.savedSnapshot;
    },
    canSave(): boolean {
      return Boolean(
        this.dirty &&
        this.draft.host &&
        this.draft.username &&
        this.draft.from_email &&
        (this.draft.password || this.smtp?.password_configured)
      );
    }
  },
  async mounted() {
    await this.load();
  },
  methods: {
    safeDraft(): ISiteAuthEmailSmtp {
      const value = { ...this.draft };
      if (!value.password) delete value.password;
      delete value.test_proof;
      return value;
    },
    apply(delivery: ISiteAuthDelivery) {
      this.delivery = delivery || { type: 'platform' };
      this.draft = this.delivery.smtp ? { ...this.delivery.smtp, password: '' } : emptySmtp();
      this.savedSnapshot = JSON.stringify(this.safeDraft());
      this.testProof = '';
      this.resultMessage = '';
    },
    async load() {
      this.loading = true;
      try {
        const { data } = await siteAuthDeliveryOperator.get(this.siteId);
        this.apply(data.providers.email?.delivery || { type: 'platform' });
      } finally {
        this.loading = false;
      }
    },
    onSecurityChange(value: SiteEmailTransportSecurity) {
      this.draft.port = value === 'implicit_tls' ? 465 : 587;
    },
    async update(delivery: ISiteAuthDelivery) {
      const { data } = await siteAuthDeliveryOperator.update(this.siteId, 'email', delivery);
      this.apply(data);
    },
    async saveDraft() {
      if (!this.canSave) return;
      const draft = this.safeDraft();
      this.saving = true;
      try {
        if (this.active) {
          const { data } = await siteAuthDeliveryOperator.update(this.siteId, 'email', {
            type: 'platform',
            smtp: this.smtp
          });
          this.delivery = data;
          this.testProof = '';
          this.resultMessage = '';
        }
        await this.update({ type: 'platform', smtp: draft });
        ElMessage.success(this.$t('site.message.authEmailTransportSaved'));
      } catch {
        ElMessage.error(this.$t('site.error.authEmailTransportSave'));
      } finally {
        this.saving = false;
      }
    },
    async testDelivery() {
      this.testing = true;
      try {
        const { data } = await siteAuthDeliveryOperator.testEmail(this.siteId);
        this.resultOk = data.success;
        this.testProof = data.success ? data.test_proof || '' : '';
        this.resultMessage = data.success
          ? this.$t('site.message.authEmailTransportTestOk')
          : this.$t(`site.error.authEmailTransport_${data.code || 'unknown'}`);
      } finally {
        this.testing = false;
      }
    },
    async toggleDelivery(value: string | number | boolean) {
      const enabled = value === true;
      if (enabled && (this.dirty || (!this.testProof && !this.smtp?.verified) || !this.smtp)) {
        ElMessage.warning(this.$t('site.message.authDeliveryEnableHelp'));
        return;
      }
      const preserveDraft = !enabled && this.dirty;
      const draft = { ...this.draft };
      this.changing = true;
      try {
        const { data } = await siteAuthDeliveryOperator.update(this.siteId, 'email', {
          type: enabled ? 'smtp' : 'platform',
          smtp: enabled ? { ...this.smtp!, test_proof: this.testProof || undefined } : this.smtp
        });
        this.apply(data);
        if (preserveDraft) this.draft = draft;
        ElMessage.success(
          this.$t(enabled ? 'site.message.authDeliveryActivated' : 'site.message.authDeliveryPlatformActivated')
        );
      } catch {
        ElMessage.error(this.$t('site.error.authDeliveryChange'));
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
        await siteAuthDeliveryOperator.remove(this.siteId, 'email');
        this.apply({ type: 'platform', smtp: null });
      } finally {
        this.deleting = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.email-delivery__content,
.email-delivery__form {
  width: min(100%, 520px);
  align-items: stretch;
}
.email-delivery__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.email-delivery__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
