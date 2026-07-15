<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />

    <!--
      Section 1: which providers are offered on the login screen.
      One row per provider with an on/off switch — at least one
      provider must stay enabled, otherwise the user could lock
      themselves and every other end-user out of this site.
    -->
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.authEnabledProviders') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.authEnabledProvidersTip') }}
        </p>
      </div>
      <div class="settings-content auth-providers-content">
        <ul class="auth-providers-list">
          <li v-for="option in providerOptions" :key="option.value" class="auth-providers-row">
            <span class="auth-providers-row__label">{{ option.label }}</span>
            <el-switch
              :model-value="isProviderEnabled(option.value)"
              :disabled="isOnlyEnabledProvider(option.value)"
              @change="(checked: boolean | string | number) => onProviderToggle(option.value, Boolean(checked))"
            />
          </li>
        </ul>
      </div>
    </section>

    <!--
      Section 2: which provider is selected by default when the login
      page first opens. Constrained to the currently-enabled set — if
      a previously-default provider was just disabled in section 1 we
      auto-promote the first remaining enabled provider so the field
      is never left in an inconsistent ``default ∉ enabled`` state.
    -->
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.authDefaultProvider') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.authDefaultProviderTip') }}
        </p>
      </div>
      <div class="settings-content">
        <el-select
          :model-value="defaultProvider"
          class="auth-default-provider-select"
          :placeholder="$t('site.placeholder.authDefaultProvider')"
          @change="onDefaultProviderChange"
        >
          <el-option
            v-for="option in defaultProviderOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </el-select>
      </div>
    </section>

    <!--
      Section 3: how the login UI is launched on the web surface —
      a full-page redirect to the auth host (default) or the embedded
      iframe popup. Site-level config, so every visitor of this site
      follows the admin's choice (native/desktop always use the iframe
      regardless — those surfaces short-circuit before reading this).
    -->
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.loginMode') }}</p>
      </div>
      <div class="settings-content">
        <el-select :model-value="loginMode" class="auth-default-provider-select" @change="onLoginModeChange">
          <el-option :value="'redirect'" :label="$t('common.loginMode.redirect')" />
          <el-option :value="'iframe'" :label="$t('common.loginMode.iframe')" />
        </el-select>
      </div>
    </section>

    <!--
      Section 4: custom SMS sender. When enabled, this site's phone
      verification codes are delivered through the owner's own HTTPS
      webhook under their own SMS signature (plan 44) instead of the
      platform default. Stored under ``site.auth.sms``; the signing
      secret is write-only (never returned — blank field = keep stored).
      Only configurable when the phone-number login provider is enabled.
    -->
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">
          {{ $t('site.field.authSmsWebhook') }}
          <el-button link type="primary" class="auth-sms-doc-link" @click="smsDocVisible = true">
            {{ $t('site.field.authSmsWebhookDoc') }}
          </el-button>
        </p>
        <p class="settings-tip">{{ $t('site.message.authSmsWebhookTip') }}</p>
      </div>
      <div class="settings-content auth-sms-content">
        <el-tooltip
          :disabled="isProviderEnabled('phone')"
          :content="$t('site.message.authSmsWebhookNeedsPhone')"
          placement="top"
        >
          <span class="auth-sms-toggle">
            <el-switch
              :model-value="smsCustomEnabled"
              :disabled="!isProviderEnabled('phone')"
              @change="(checked: boolean | string | number) => onSmsCustomToggle(Boolean(checked))"
            />
            <span class="auth-sms-toggle__label">{{ $t('site.field.authSmsWebhookEnable') }}</span>
          </span>
        </el-tooltip>

        <template v-if="smsCustomEnabled && isProviderEnabled('phone')">
          <el-input
            :model-value="smsUrlDraft"
            class="auth-sms-input"
            :placeholder="$t('site.placeholder.authSmsWebhookUrl')"
            @update:model-value="(value: string) => (smsUrlDraft = value)"
            @change="onSmsWebhookUrlChange"
          />
          <el-input
            :model-value="smsSecretDraft"
            type="password"
            show-password
            class="auth-sms-input"
            :placeholder="$t('site.placeholder.authSmsWebhookSecret')"
            @update:model-value="(value: string) => (smsSecretDraft = value)"
            @change="onSmsWebhookSecretChange"
          />
          <div class="auth-sms-actions">
            <el-button :disabled="!smsUrlDraft" @click="openSmsTest">
              {{ $t('site.field.authSmsWebhookTest') }}
            </el-button>
          </div>
        </template>
      </div>
    </section>

    <!-- Doc dialog: what the owner's webhook must accept / return. -->
    <el-dialog
      v-model="smsDocVisible"
      :title="$t('site.field.authSmsWebhookDocTitle')"
      class="auth-sms-dialog"
      width="640px"
    >
      <div class="auth-sms-doc">
        <p>{{ $t('site.message.authSmsWebhookDocIntro') }}</p>
        <h4>{{ $t('site.field.authSmsWebhookDocRequest') }}</h4>
        <p>{{ $t('site.message.authSmsWebhookDocRequest') }}</p>
        <pre class="auth-sms-code">{{ smsDocRequestExample }}</pre>
        <h4>{{ $t('site.field.authSmsWebhookDocHeaders') }}</h4>
        <p>{{ $t('site.message.authSmsWebhookDocHeaders') }}</p>
        <pre class="auth-sms-code">{{ smsDocSignatureExample }}</pre>
        <h4>{{ $t('site.field.authSmsWebhookDocResponse') }}</h4>
        <p>{{ $t('site.message.authSmsWebhookDocResponse') }}</p>
        <pre class="auth-sms-code">{{ smsDocResponseExample }}</pre>
      </div>
      <template #footer>
        <el-button type="primary" @click="smsDocVisible = false">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Test dialog: dry-run a signed ``purpose=test`` request to the webhook. -->
    <el-dialog
      v-model="smsTestVisible"
      :title="$t('site.field.authSmsWebhookTestTitle')"
      class="auth-sms-dialog"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item :label="$t('site.placeholder.authSmsWebhookUrl')">
          <el-input v-model="smsTest.url" />
        </el-form-item>
        <el-form-item :label="$t('site.placeholder.authSmsWebhookSecret')">
          <el-input v-model="smsTest.secret" type="password" show-password />
        </el-form-item>
        <el-form-item :label="$t('site.field.authSmsWebhookTestRegion')">
          <el-input v-model="smsTest.region" placeholder="86" />
        </el-form-item>
        <el-form-item :label="$t('site.field.authSmsWebhookTestNumber')">
          <el-input v-model="smsTest.number" />
        </el-form-item>
      </el-form>
      <el-alert
        v-if="smsTestResult"
        :type="smsTestResult.ok ? 'success' : 'error'"
        :title="smsTestResult.message"
        :closable="false"
        show-icon
      />
      <template #footer>
        <el-button @click="smsTestVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="smsTesting" :disabled="!smsTest.url || !smsTest.secret" @click="runSmsTest">
          {{ $t('site.field.authSmsWebhookTestSend') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
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
  ElOption,
  ElSelect,
  ElSwitch,
  ElTooltip
} from 'element-plus';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { siteOperator, smsWebhookOperator } from '@/operators';
import type { ISiteAuth, ISiteAuthProvider } from '@/models';
import { toWritableSitePayload } from '@/utils';

// Provider IDs we surface in this tab. The IDs match
// ``IUserPublicRegistrationMethod`` in ``src/models/user.ts`` so the
// values written to ``site.auth.providers`` line up with what
// AuthBackend already understands when the login flow is wired up to
// honour this config. The ``username`` provider is intentionally
// omitted — it's an internal/admin-only mechanism and not something
// site owners should expose to end users.
const PROVIDER_IDS = ['email', 'google', 'github', 'apple', 'phone', 'wechat'] as const;
type ProviderId = (typeof PROVIDER_IDS)[number];

interface ProviderOption {
  value: ProviderId;
  label: string;
}

export default defineComponent({
  name: 'AuthSetting',
  components: {
    ElAlert,
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElOption,
    ElSelect,
    ElSwitch,
    ElTooltip,
    SectionNotice
  },
  data() {
    return {
      // Local drafts so the test dialog can validate exactly what's typed
      // (the stored secret is redacted on read, so the field starts blank).
      smsCustomEnabled: false,
      smsUrlDraft: '',
      smsSecretDraft: '',
      smsDocVisible: false,
      smsTestVisible: false,
      smsTesting: false,
      smsTest: { url: '', secret: '', region: '', number: '' },
      smsTestResult: null as { ok: boolean; message: string } | null
    };
  },
  computed: {
    site() {
      return this.$store.getters.site || {};
    },
    auth(): ISiteAuth {
      return (this.site?.auth as ISiteAuth) || {};
    },
    providers(): Record<string, ISiteAuthProvider> {
      return this.auth.providers || {};
    },
    enabledProviders(): ProviderId[] {
      // Render checkboxes for the known provider IDs in a stable order
      // (PROVIDER_IDS) rather than whatever ordering happens to live in
      // the JSON blob. We deliberately ignore unknown provider keys —
      // they're preserved on save but invisible here so a stale
      // provider name from a future schema doesn't show up as a
      // mystery checkbox.
      return PROVIDER_IDS.filter((id) => this.providers?.[id]?.enabled === true);
    },
    defaultProvider(): string {
      return this.auth.default_provider || '';
    },
    loginMode(): 'iframe' | 'redirect' {
      // Fall back to the platform default (redirect) so the dropdown
      // always shows a concrete selection, even on legacy sites whose
      // ``auth`` blob predates the ``login_mode`` field.
      return this.auth.login_mode === 'iframe' ? 'iframe' : 'redirect';
    },
    providerOptions(): ProviderOption[] {
      return PROVIDER_IDS.map((value) => ({
        value,
        label: this.$t(`site.field.authProvider_${value}`)
      }));
    },
    defaultProviderOptions(): ProviderOption[] {
      // The default provider list is constrained to the currently
      // enabled providers — you can't default to something that won't
      // even render on the login page.
      const enabled = new Set(this.enabledProviders);
      return this.providerOptions.filter((opt) => enabled.has(opt.value));
    },
    smsDocRequestExample(): string {
      // Literal reference envelope the owner's endpoint receives (kept out
      // of i18n — it's code, not prose). Mirrors AuthBackend's payload.
      return [
        'POST https://your-domain/sms-webhook  (HTTPS only)',
        'Content-Type: application/json',
        '',
        '{',
        '  "type": "verification.code.request",',
        '  "site": "your-site.com",',
        '  "channel": "sms",',
        '  "purpose": "login",',
        '  "locale": "en",',
        '  "to": { "region": "86", "number": "13800000000" },',
        '  "data": { "code": "123456", "ttl_seconds": 1800 }',
        '}'
      ].join('\n');
    },
    smsDocSignatureExample(): string {
      return [
        'webhook-id: msg_2b1c...          // unique per request',
        'webhook-timestamp: 1720000000    // unix seconds',
        'webhook-signature: v1,<base64>   // see below',
        '',
        '// verify (Standard Webhooks):',
        'signed = `${webhook-id}.${webhook-timestamp}.${rawBody}`',
        'expected = "v1," + base64(HMAC_SHA256(secret, signed))',
        '// constant-time compare expected === webhook-signature'
      ].join('\n');
    },
    smsDocResponseExample(): string {
      return [
        'HTTP 200  → success',
        '',
        '// or, to signal failure explicitly:',
        '{ "success": false, "error": { "message": "..." } }'
      ].join('\n');
    }
  },
  created() {
    // Seed the toggle + URL draft from the stored config once on open.
    // The secret is never returned by the API, so its field stays blank
    // ("leave blank to keep") until the owner (re)types it.
    this.smsUrlDraft = this.auth.sms?.webhook_url || '';
    this.smsCustomEnabled = !!this.auth.sms?.webhook_url;
  },
  methods: {
    isProviderEnabled(id: ProviderId): boolean {
      return this.providers?.[id]?.enabled === true;
    },
    isOnlyEnabledProvider(id: ProviderId): boolean {
      // Lock the last remaining enabled switch so the user can't
      // disable every provider at once and leave the site unable to
      // accept any login.
      return this.enabledProviders.length === 1 && this.enabledProviders[0] === id;
    },
    onProviderToggle(id: ProviderId, checked: boolean) {
      // Re-derive the next enabled set from the current store state
      // plus this single toggle. Doing the derivation here (instead of
      // relying on v-model on every switch) keeps the logic symmetric
      // with the previous group-checkbox flow and makes the "last
      // enabled cannot be turned off" guard robust against a devtools
      // poke.
      const nextEnabled = new Set(this.enabledProviders);
      if (checked) {
        nextEnabled.add(id);
      } else {
        nextEnabled.delete(id);
      }
      if (nextEnabled.size === 0) {
        ElMessage.warning(this.$t('site.message.authProvidersAtLeastOne'));
        return;
      }
      const nextProviders: Record<string, ISiteAuthProvider> = { ...(this.providers || {}) };
      for (const pid of PROVIDER_IDS) {
        nextProviders[pid] = {
          ...(nextProviders[pid] || {}),
          enabled: nextEnabled.has(pid)
        };
      }
      // If the current default just got disabled, auto-promote the
      // first remaining enabled provider so ``default ∈ enabled``
      // stays invariant.
      let nextDefault = this.defaultProvider;
      if (!nextDefault || !nextEnabled.has(nextDefault as ProviderId)) {
        nextDefault = PROVIDER_IDS.find((pid) => nextEnabled.has(pid)) || id;
      }
      this.persistAuth({
        ...this.auth,
        providers: nextProviders,
        default_provider: nextDefault
      });
    },
    onDefaultProviderChange(value: ProviderId | '') {
      if (!value) return;
      // Defending the ``default ∈ enabled`` invariant from the other
      // direction: if the user somehow picks a disabled provider (the
      // UI filters these out, but the ``model-value`` may transiently
      // carry one after a prior save), enable it too.
      const nextProviders: Record<string, ISiteAuthProvider> = { ...(this.providers || {}) };
      for (const id of PROVIDER_IDS) {
        nextProviders[id] = {
          ...(nextProviders[id] || {}),
          enabled: id === value ? true : nextProviders[id]?.enabled === true
        };
      }
      this.persistAuth({
        ...this.auth,
        providers: nextProviders,
        default_provider: value
      });
    },
    onLoginModeChange(value: 'iframe' | 'redirect') {
      this.persistAuth({
        ...this.auth,
        login_mode: value
      });
    },
    async onSmsCustomToggle(checked: boolean) {
      if (checked) {
        this.smsCustomEnabled = true;
        return;
      }
      // Turning it off removes the custom sender entirely — the site falls
      // back to the platform default signature. The signing secret is
      // write-only / unrecoverable, so confirm before discarding it.
      if (this.auth.sms?.webhook_url) {
        try {
          await ElMessageBox.confirm(
            this.$t('site.message.authSmsWebhookDisableConfirm'),
            this.$t('site.field.authSmsWebhookDisableTitle'),
            {
              type: 'warning',
              confirmButtonText: this.$t('common.button.confirm'),
              cancelButtonText: this.$t('common.button.cancel')
            }
          );
        } catch {
          return; // canceled — leave it enabled
        }
      }
      this.smsCustomEnabled = false;
      this.smsUrlDraft = '';
      this.smsSecretDraft = '';
      const nextAuth = { ...this.auth };
      delete nextAuth.sms;
      this.persistAuth(nextAuth);
    },
    onSmsWebhookUrlChange(value: string) {
      // Persist the webhook URL under ``auth.sms``. The stored secret is
      // redacted on read, so it's absent here — the backend merge-preserves
      // the existing secret when the payload omits it.
      const url = (value || '').trim();
      this.smsUrlDraft = url;
      const sms = { ...(this.auth.sms || {}) };
      if (url) {
        sms.webhook_url = url;
      } else {
        delete sms.webhook_url;
      }
      this.persistAuth({ ...this.auth, sms });
    },
    onSmsWebhookSecretChange(value: string) {
      // Write-only: only send a non-empty secret. Blank means "keep the
      // stored one" (the backend preserves it), so don't overwrite.
      const webhook_secret = (value || '').trim();
      if (!webhook_secret) {
        return;
      }
      this.persistAuth({ ...this.auth, sms: { ...(this.auth.sms || {}), webhook_secret } });
    },
    openSmsTest() {
      // Pre-fill from the current drafts so the owner tests exactly what's
      // typed (incl. an unsaved secret). Secret may be blank if they haven't
      // re-typed it — the send button stays disabled until both are present.
      this.smsTest = { url: this.smsUrlDraft, secret: this.smsSecretDraft, region: '', number: '' };
      this.smsTestResult = null;
      this.smsTestVisible = true;
    },
    async runSmsTest() {
      const url = (this.smsTest.url || '').trim();
      const secret = (this.smsTest.secret || '').trim();
      if (!url || !secret) {
        return;
      }
      this.smsTesting = true;
      this.smsTestResult = null;
      try {
        const { data } = await smsWebhookOperator.test({
          webhook_url: url,
          webhook_secret: secret,
          site: this.site?.origin || '',
          region: (this.smsTest.region || '').trim(),
          receiver: (this.smsTest.number || '').trim()
        });
        if (data?.success) {
          this.smsTestResult = { ok: true, message: this.$t('site.message.authSmsWebhookTestOk') };
        } else {
          this.smsTestResult = {
            ok: false,
            message: data?.message || this.$t('site.message.authSmsWebhookTestFailed')
          };
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message || error?.message || this.$t('site.message.authSmsWebhookTestFailed');
        this.smsTestResult = { ok: false, message };
      } finally {
        this.smsTesting = false;
      }
    },
    persistAuth(nextAuth: ISiteAuth) {
      const payload = {
        ...toWritableSitePayload(this.site),
        auth: nextAuth
      };
      siteOperator.update(this.site?.id, payload).then(() => {
        console.debug('getSite for id', this.site?.id);
        this.$store.dispatch('getSite');
      });
    }
  }
});
</script>

<style lang="scss" scoped>
// The settings row uses ``display:flex; justify-content:space-between``
// from the parent ``user/Setting.vue`` (``:deep(.settings-item)``). Its
// ``.settings-label`` ships without ``min-width: 0``, so when an inner
// ``.settings-tip`` carries ``max-width: 440px`` the label's flex
// preferred size resolves to ~440px. On the 50%-dialog the available
// content width can be as little as ~400px, which pushes the right
// switch column past the gutter and visually overlaps the tip text
// with the provider labels (邮箱 / Google / GitHub / 手机号 / 微信).
//
// Force the label column to share the row by:
//   * letting it grow into all remaining space (``flex: 1 1 0``)
//   * unlocking flex-shrink below intrinsic min-content (``min-width:0``)
//
// And lock the right column to its content size so it never gets
// squeezed below the toggle width either.
:deep(.settings-item) {
  .settings-label {
    flex: 1 1 0;
    min-width: 0;
  }
}

.auth-providers-content {
  // Let the switch list stretch the full content column so each
  // row aligns its label and toggle in a single visual gutter, and
  // pin the column to its intrinsic width so it never collides with
  // the tip text on narrow viewports.
  align-items: stretch;
  flex: 0 0 auto;
}

.auth-providers-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  // 220px is enough to render the longest provider label (``GitHub``)
  // plus the el-switch comfortably; the earlier 240px was wide enough
  // to monopolise the row on a 50%-width dialog and starve the tip.
  min-width: 220px;
}

.auth-providers-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;

  & + & {
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.auth-default-provider-select {
  min-width: 240px;
}

.auth-sms-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.auth-sms-doc-link {
  margin-left: 8px;
  vertical-align: baseline;
  font-size: 13px;
}

.auth-sms-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &__label {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

.auth-sms-input {
  width: 100%;
  max-width: 360px;
}

.auth-sms-actions {
  display: flex;
  gap: 8px;
}

.auth-sms-doc {
  h4 {
    margin: 16px 0 6px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

.auth-sms-code {
  margin: 0;
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
