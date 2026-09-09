<template>
  <section class="settings-item phone-delivery">
    <div class="settings-label">
      <p class="settings-title">{{ $t('site.field.authSmsWebhook') }}</p>
      <p class="settings-tip">{{ $t('site.message.authSmsWebhookTip') }}</p>
    </div>
    <div class="settings-content phone-delivery__content">
      <el-alert
        v-if="!providerEnabled"
        :title="$t('site.message.authDeliveryProviderDisabled')"
        type="info"
        :closable="false"
      />
      <el-radio-group v-model="viewMode" :disabled="loading">
        <el-radio-button label="platform">{{ $t('site.option.authDeliveryPlatform') }}</el-radio-button>
        <el-radio-button label="webhook">{{ $t('site.option.authPhoneDeliveryWebhook') }}</el-radio-button>
      </el-radio-group>
      <div v-if="viewMode === 'platform'" class="phone-delivery__panel">
        <el-alert v-if="!active" :title="$t('site.option.authDeliveryPlatform')" type="success" :closable="false" />
        <el-button v-if="active" type="primary" :loading="changing" @click="switchToPlatform">
          {{ $t('site.button.authEmailTransportDisable') }}
        </el-button>
      </div>
      <div v-else class="phone-delivery__panel">
        <el-button link type="primary" class="phone-delivery__docs-link" @click="docsVisible = true">
          {{ $t('site.field.authSmsWebhookDoc') }}
        </el-button>
        <el-alert
          v-if="webhook?.verification_source === 'legacy_migration'"
          :title="$t('site.message.authDeliveryMigrated')"
          type="warning"
          :closable="false"
        />
        <el-form label-position="top">
          <el-form-item :label="$t('site.placeholder.authSmsWebhookUrl')">
            <el-input v-model="draft.url" :disabled="active" />
          </el-form-item>
          <el-form-item :label="$t('site.placeholder.authSmsWebhookSecret')">
            <el-input v-model="draft.secret" :disabled="active" type="password" show-password />
            <span v-if="webhook?.secret_configured" class="phone-delivery__hint">
              {{ $t('site.message.authSmsWebhookSecretConfigured') }}
            </span>
          </el-form-item>
          <template v-if="!active && webhook?.secret_configured && !dirty">
            <el-form-item :label="$t('site.field.authSmsWebhookTestRegion')">
              <el-input v-model="testTarget.region" placeholder="86" />
            </el-form-item>
            <el-form-item :label="$t('site.field.authSmsWebhookTestNumber')">
              <el-input v-model="testTarget.receiver" />
            </el-form-item>
          </template>
        </el-form>
        <el-alert
          v-if="resultMessage"
          :title="resultMessage"
          :type="resultOk ? 'success' : 'error'"
          :closable="false"
        />
        <div class="phone-delivery__actions">
          <el-button v-if="!active" type="primary" :loading="saving" :disabled="!canSave" @click="saveDraft">
            {{ $t('site.button.authEmailTransportSave') }}
          </el-button>
          <el-button
            v-if="!active"
            :loading="testing"
            :disabled="dirty || !webhook?.secret_configured || !testTarget.receiver || !testTarget.region"
            @click="testDelivery"
          >
            {{ $t('site.field.authSmsWebhookTest') }}
          </el-button>
          <el-button
            v-if="!active"
            type="success"
            :loading="changing"
            :disabled="dirty || (!testProof && !webhook?.verified)"
            @click="activate"
          >
            {{ $t('site.button.authEmailTransportEnable') }}
          </el-button>
          <el-button v-if="active" :loading="changing" @click="switchToPlatform">
            {{ $t('site.button.authEmailTransportDisable') }}
          </el-button>
          <el-button v-if="!active && webhook" type="danger" plain :loading="deleting" @click="remove">
            {{ $t('common.button.delete') }}
          </el-button>
        </div>
      </div>
      <el-dialog v-model="docsVisible" :title="$t('site.field.authSmsWebhookDocTitle')" width="min(640px, 90vw)">
        <div class="phone-delivery__docs">
          <p>{{ $t('site.message.authSmsWebhookDocIntro') }}</p>
          <h4>{{ $t('site.field.authSmsWebhookDocRequest') }}</h4>
          <p>{{ $t('site.message.authSmsWebhookDocRequest') }}</p>
          <pre>{{ webhookRequestExample }}</pre>
          <h4>{{ $t('site.field.authSmsWebhookDocHeaders') }}</h4>
          <p>{{ $t('site.message.authSmsWebhookDocHeaders') }}</p>
          <pre>{{ webhookSignatureExample }}</pre>
          <h4>{{ $t('site.field.authSmsWebhookDocResponse') }}</h4>
          <p>{{ $t('site.message.authSmsWebhookDocResponse') }}</p>
          <pre>
HTTP 204

{ "success": false }</pre
          >
        </div>
      </el-dialog>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElRadioButton,
  ElRadioGroup
} from 'element-plus';
import type { ISiteAuthDelivery, ISiteAuthPhoneWebhook } from '@/models/site';
import { siteAuthDeliveryOperator } from '@/operators/siteAuthDelivery';

const emptyWebhook = (): ISiteAuthPhoneWebhook => ({ url: '', secret: '' });

export default defineComponent({
  name: 'SitePhoneDelivery',
  components: { ElAlert, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElRadioButton, ElRadioGroup },
  props: {
    siteId: { type: String, required: true },
    providerEnabled: { type: Boolean, required: true }
  },
  data() {
    return {
      delivery: { type: 'platform' } as ISiteAuthDelivery,
      viewMode: 'platform' as 'platform' | 'webhook',
      docsVisible: false,
      draft: emptyWebhook(),
      savedSnapshot: '',
      testTarget: { receiver: '', region: '86', locale: this.$i18n.locale || 'en' },
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
    webhook(): ISiteAuthPhoneWebhook | null {
      return this.delivery.webhook || null;
    },
    webhookRequestExample(): string {
      return JSON.stringify(
        {
          type: 'verification.code.request',
          site: 'studio.example.com',
          channel: 'sms',
          purpose: 'register',
          locale: 'zh-CN',
          to: { region: '86', number: '13800138000' },
          data: { code: '483920', ttl_seconds: 1800 }
        },
        null,
        2
      );
    },
    webhookSignatureExample(): string {
      return [
        'webhook-id: msg_2b1c...',
        'webhook-timestamp: 1788748800',
        'webhook-signature: v1,<base64>',
        '',
        'signed = `${webhookId}.${webhookTimestamp}.${rawBody}`',
        'expected = "v1," + base64(HMAC_SHA256(secret, signed))'
      ].join('\n');
    },
    active(): boolean {
      return this.delivery.type === 'webhook';
    },
    dirty(): boolean {
      return JSON.stringify(this.safeDraft()) !== this.savedSnapshot;
    },
    canSave(): boolean {
      return Boolean(this.dirty && this.draft.url && (this.draft.secret || this.webhook?.secret_configured));
    }
  },
  async mounted() {
    await this.load();
  },
  methods: {
    safeDraft(): ISiteAuthPhoneWebhook {
      const value = { ...this.draft };
      if (!value.secret) delete value.secret;
      delete value.test_proof;
      return value;
    },
    apply(delivery: ISiteAuthDelivery, syncView = false) {
      this.delivery = delivery || { type: 'platform' };
      if (syncView) this.viewMode = this.delivery.type === 'webhook' ? 'webhook' : 'platform';
      this.draft = this.delivery.webhook ? { ...this.delivery.webhook, secret: '' } : emptyWebhook();
      this.savedSnapshot = JSON.stringify(this.safeDraft());
      this.testProof = '';
    },
    async load() {
      this.loading = true;
      try {
        const { data } = await siteAuthDeliveryOperator.get(this.siteId);
        this.apply(data.providers.phone?.delivery || { type: 'platform' }, true);
      } finally {
        this.loading = false;
      }
    },
    async update(delivery: ISiteAuthDelivery) {
      const { data } = await siteAuthDeliveryOperator.update(this.siteId, 'phone', delivery);
      this.apply(data);
    },
    async saveDraft() {
      if (!this.canSave) return;
      this.saving = true;
      try {
        await this.update({ type: 'platform', webhook: this.safeDraft() });
        ElMessage.success(this.$t('site.message.authEmailTransportSaved'));
      } finally {
        this.saving = false;
      }
    },
    async testDelivery() {
      this.testing = true;
      try {
        const { data } = await siteAuthDeliveryOperator.testPhone(this.siteId, this.testTarget);
        this.resultOk = data.success;
        this.testProof = data.success ? data.test_proof || '' : '';
        this.resultMessage = data.success
          ? this.$t('site.message.authSmsWebhookTestOk')
          : this.$t('site.message.authSmsWebhookTestFailed');
      } finally {
        this.testing = false;
      }
    },
    async activate() {
      if (this.dirty || (!this.testProof && !this.webhook?.verified) || !this.webhook) return;
      this.changing = true;
      try {
        await this.update({
          type: 'webhook',
          webhook: { ...this.webhook, test_proof: this.testProof || undefined }
        });
      } finally {
        this.changing = false;
      }
    },
    async switchToPlatform() {
      this.changing = true;
      try {
        await this.update({ type: 'platform', webhook: this.webhook });
      } finally {
        this.changing = false;
      }
    },
    async remove() {
      try {
        await ElMessageBox.confirm(
          this.$t('site.message.authSmsWebhookDisableConfirm'),
          this.$t('site.field.authSmsWebhookDisableTitle'),
          { type: 'warning' }
        );
      } catch {
        return;
      }
      this.deleting = true;
      try {
        await siteAuthDeliveryOperator.remove(this.siteId, 'phone');
        this.apply({ type: 'platform', webhook: null });
      } finally {
        this.deleting = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.phone-delivery__content {
  width: min(100%, 520px);
  align-items: stretch;
}
.phone-delivery__panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.phone-delivery__docs-link {
  align-self: flex-start;
  padding: 0;
}
.phone-delivery__docs h4 {
  margin: 16px 0 6px;
}
.phone-delivery__docs p {
  margin: 0 0 8px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.phone-delivery__docs pre {
  overflow-x: auto;
  margin: 0;
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.phone-delivery__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.phone-delivery__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
