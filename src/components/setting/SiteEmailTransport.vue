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
      <el-radio-group :model-value="delivery.type" :disabled="loading || changing" @change="changeType">
        <el-radio-button value="platform">{{ $t('site.option.authDeliveryPlatform') }}</el-radio-button>
        <el-radio-button value="smtp">{{ $t('site.option.authEmailDeliverySmtp') }}</el-radio-button>
      </el-radio-group>
      <el-alert
        v-if="smtp?.verification_source === 'legacy_migration'"
        :title="$t('site.message.authDeliveryMigrated')"
        type="warning"
        :closable="false"
      />
      <el-form label-position="top" class="email-delivery__form">
        <el-form-item :label="$t('site.field.authEmailTransportSecurity')">
          <el-select v-model="draft.security" :disabled="active" @change="onSecurityChange">
            <el-option value="starttls" :label="$t('site.option.authEmailTransportStarttls')" />
            <el-option value="implicit_tls" :label="$t('site.option.authEmailTransportImplicitTls')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportHost')">
          <el-input v-model="draft.host" :disabled="active" placeholder="smtp.example.com" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportUsername')">
          <el-input v-model="draft.username" :disabled="active" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportPassword')">
          <el-input v-model="draft.password" :disabled="active" type="password" show-password />
          <span v-if="smtp?.password_configured" class="email-delivery__hint">
            {{ $t('site.message.authEmailTransportPasswordConfigured') }}
          </span>
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportFromEmail')">
          <el-input v-model="draft.from_email" :disabled="active" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportFromName')">
          <el-input v-model="draft.from_name" :disabled="active" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authEmailTransportReplyTo')">
          <el-input v-model="draft.reply_to" :disabled="active" />
        </el-form-item>
      </el-form>
      <el-alert v-if="resultMessage" :title="resultMessage" :type="resultOk ? 'success' : 'error'" :closable="false" />
      <div class="email-delivery__actions">
        <el-button v-if="!active" type="primary" :loading="saving" :disabled="!canSave" @click="saveDraft">
          {{ $t('site.button.authEmailTransportSave') }}
        </el-button>
        <el-button
          v-if="!active"
          :loading="testing"
          :disabled="!smtp?.password_configured || dirty"
          @click="testDelivery"
        >
          {{ $t('site.button.authEmailTransportTest') }}
        </el-button>
        <el-button
          v-if="!active"
          type="success"
          :loading="changing"
          :disabled="dirty || (!testProof && !smtp?.verified)"
          @click="activate"
        >
          {{ $t('site.button.authEmailTransportEnable') }}
        </el-button>
        <el-button v-if="active" :loading="changing" @click="switchToPlatform">
          {{ $t('site.button.authEmailTransportDisable') }}
        </el-button>
        <el-button v-if="!active && smtp" type="danger" plain :loading="deleting" @click="remove">
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
  ElRadioButton,
  ElRadioGroup,
  ElSelect
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
    ElRadioButton,
    ElRadioGroup,
    ElSelect
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
      this.saving = true;
      try {
        await this.update({ type: 'platform', smtp: this.safeDraft() });
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
    async activate() {
      if (this.dirty || (!this.testProof && !this.smtp?.verified) || !this.smtp) return;
      this.changing = true;
      try {
        await this.update({
          type: 'smtp',
          smtp: { ...this.smtp, test_proof: this.testProof || undefined }
        });
      } finally {
        this.changing = false;
      }
    },
    async switchToPlatform() {
      this.changing = true;
      try {
        await this.update({ type: 'platform', smtp: this.smtp });
      } finally {
        this.changing = false;
      }
    },
    async changeType(value: string | number | boolean | undefined) {
      if (value === 'platform' && this.active) await this.switchToPlatform();
      if (value === 'smtp' && !this.active) await this.activate();
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
