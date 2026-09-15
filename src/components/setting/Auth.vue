<template>
  <div class="settings-list auth-settings">
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
              :disabled="!managementLoaded || isOnlyEnabledProvider(option.value)"
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
          :disabled="!managementLoaded"
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
        <el-select
          :model-value="loginMode"
          :disabled="!managementLoaded"
          class="auth-default-provider-select"
          @change="onLoginModeChange"
        >
          <el-option :value="'redirect'" :label="$t('common.loginMode.redirect')" />
          <el-option :value="'iframe'" :label="$t('common.loginMode.iframe')" />
        </el-select>
      </div>
    </section>

    <template v-if="managementLoaded">
      <site-o-auth-app-editor
        v-for="descriptor in oauthProviderDescriptors"
        :key="descriptor.id"
        :descriptor="descriptor"
        :credentials="oauthCredentials(descriptor.id)"
        :provider-enabled="isProviderEnabled(descriptor.id)"
        :saving="saving"
        @change="saveOAuthCredentials(descriptor.id, $event)"
      />
    </template>
    <site-email-transport
      v-if="managementLoaded"
      :site-id="site.id"
      :provider-enabled="isProviderEnabled('email')"
      :delivery-config="emailDelivery"
      :update-delivery="updateEmailDelivery"
    />
    <site-phone-delivery
      v-if="managementLoaded"
      :site-id="site.id"
      :provider-enabled="isProviderEnabled('phone')"
      :delivery-config="phoneDelivery"
      :update-delivery="updatePhoneDelivery"
    />
    <div class="auth-save-actions">
      <el-button type="primary" :loading="saving" :disabled="!managementLoaded || !authDirty" @click="save">
        {{ $t('common.button.save') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElMessage, ElOption, ElSelect, ElSwitch } from 'element-plus';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import SiteEmailTransport from '@/components/setting/SiteEmailTransport.vue';
import SiteOAuthAppEditor from '@/components/setting/SiteOAuthAppEditor.vue';
import SitePhoneDelivery from '@/components/setting/SitePhoneDelivery.vue';
import { siteOperator } from '@/operators';
import type {
  ISiteAuth,
  ISiteAuthDelivery,
  ISiteAuthProvider,
  ISiteOAuthCredentials,
  SiteOAuthCredentialsDraft
} from '@/models';
import {
  SITE_OAUTH_PROVIDER_IDS,
  SITE_OAUTH_PROVIDERS,
  type SiteOAuthProviderId
} from '@/constants/siteOAuthProviders';

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
    ElButton,
    ElOption,
    ElSelect,
    ElSwitch,
    SectionNotice,
    SiteEmailTransport,
    SiteOAuthAppEditor,
    SitePhoneDelivery
  },
  data() {
    return {
      authDraft: undefined as ISiteAuth | undefined,
      savedAuthSnapshot: '',
      configurationRevision: undefined as number | undefined,
      managementSiteId: undefined as string | undefined,
      oauthCredentialDrafts: {} as Partial<Record<SiteOAuthProviderId, SiteOAuthCredentialsDraft>>,
      updateQueue: Promise.resolve() as Promise<void>,
      saving: false
    };
  },
  computed: {
    site() {
      return this.$store.getters.site || {};
    },
    auth(): ISiteAuth {
      return this.authDraft || {};
    },
    oauthProviderDescriptors() {
      return SITE_OAUTH_PROVIDER_IDS.map((id) => SITE_OAUTH_PROVIDERS[id]);
    },
    emailDelivery(): ISiteAuthDelivery {
      return this.auth.providers?.email?.delivery || { type: 'platform' };
    },
    phoneDelivery(): ISiteAuthDelivery {
      return this.auth.providers?.phone?.delivery || { type: 'platform' };
    },
    managementLoaded(): boolean {
      return Boolean(this.site?.id && this.managementSiteId === this.site.id);
    },
    authDirty(): boolean {
      return JSON.stringify(this.writableAuthBase()) !== this.savedAuthSnapshot;
    },
    dirty(): boolean {
      return this.authDirty || Object.keys(this.oauthCredentialDrafts).length > 0;
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
    }
  },
  watch: {
    'site.id': {
      immediate: true,
      handler(siteId?: string) {
        this.managementSiteId = undefined;
        this.authDraft = undefined;
        this.savedAuthSnapshot = '';
        this.configurationRevision = undefined;
        this.oauthCredentialDrafts = {};
        if (siteId) void this.load(siteId);
      }
    }
  },
  methods: {
    apply(siteId: string, auth: ISiteAuth, configurationRevision?: number): void {
      this.managementSiteId = siteId;
      this.authDraft = JSON.parse(JSON.stringify(auth || {}));
      this.savedAuthSnapshot = JSON.stringify(this.writableAuthBase());
      this.configurationRevision = configurationRevision;
      this.oauthCredentialDrafts = {};
    },
    async load(siteId: string): Promise<void> {
      try {
        const { data } = await siteOperator.get(siteId);
        if (this.site?.id === siteId) this.apply(siteId, data.auth || {}, data.configuration_revision);
      } catch {
        ElMessage.error(this.$t('site.error.authSettingsLoad'));
      }
    },
    writableAuthBase(): ISiteAuth {
      const auth = JSON.parse(JSON.stringify(this.authDraft || {})) as ISiteAuth;
      for (const provider of Object.values(auth.providers || {})) {
        delete provider.credentials;
        delete provider.delivery;
      }
      return auth;
    },
    writableOAuthAuth(providerId: SiteOAuthProviderId): ISiteAuth {
      const auth = this.writableAuthBase();
      const credentials = this.oauthCredentialDrafts[providerId];
      if (credentials) {
        auth.providers = auth.providers || {};
        auth.providers[providerId] = {
          ...(auth.providers[providerId] || {}),
          credentials
        };
      }
      return auth;
    },
    oauthCredentials(providerId: SiteOAuthProviderId): ISiteOAuthCredentials {
      return this.auth.providers?.[providerId]?.credentials || { mode: 'platform' };
    },
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
      this.stageAuth({
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
      this.stageAuth({
        ...this.auth,
        providers: nextProviders,
        default_provider: value
      });
    },
    onLoginModeChange(value: 'iframe' | 'redirect') {
      this.stageAuth({
        ...this.auth,
        login_mode: value
      });
    },
    stageAuth(nextAuth: ISiteAuth): void {
      this.authDraft = nextAuth;
    },
    enqueueUpdate(auth: ISiteAuth): Promise<ISiteAuth> {
      const siteId = this.site.id as string;
      const operation = async () => {
        if (this.site?.id !== siteId || this.managementSiteId !== siteId) {
          throw new Error('Site changed before updating auth settings');
        }
        const { data } = await siteOperator.update(siteId, { auth }, this.configurationRevision);
        if (this.site?.id !== siteId || this.managementSiteId !== siteId) {
          throw new Error('Site changed while updating auth settings');
        }
        this.configurationRevision = data.configuration_revision;
        return data.auth || {};
      };
      const result = this.updateQueue.then(operation, operation);
      this.updateQueue = result.then(
        () => undefined,
        () => undefined
      );
      return result;
    },
    mergeDelivery(providerId: 'email' | 'phone', delivery: ISiteAuthDelivery): void {
      const providers = { ...(this.authDraft?.providers || {}) };
      providers[providerId] = { ...(providers[providerId] || {}), delivery };
      this.authDraft = { ...(this.authDraft || {}), providers };
    },
    async updateEmailDelivery(delivery: ISiteAuthDelivery): Promise<ISiteAuthDelivery> {
      const auth = await this.enqueueUpdate({ providers: { email: { delivery } } });
      const saved = auth.providers?.email?.delivery || { type: 'platform' };
      this.mergeDelivery('email', saved);
      return saved;
    },
    async updatePhoneDelivery(delivery: ISiteAuthDelivery): Promise<ISiteAuthDelivery> {
      const auth = await this.enqueueUpdate({ providers: { phone: { delivery } } });
      const saved = auth.providers?.phone?.delivery || { type: 'platform' };
      this.mergeDelivery('phone', saved);
      return saved;
    },
    async saveOAuthCredentials(providerId: SiteOAuthProviderId, credentials: SiteOAuthCredentialsDraft): Promise<void> {
      this.oauthCredentialDrafts = { ...this.oauthCredentialDrafts, [providerId]: credentials };
      await this.saveAuth(providerId);
    },
    async save(): Promise<void> {
      await this.saveAuth();
    },
    applySavedAuth(auth: ISiteAuth, providerId?: SiteOAuthProviderId): void {
      this.authDraft = JSON.parse(JSON.stringify(auth || {}));
      this.savedAuthSnapshot = JSON.stringify(this.writableAuthBase());
      if (providerId) {
        const drafts = { ...this.oauthCredentialDrafts };
        delete drafts[providerId];
        this.oauthCredentialDrafts = drafts;
      }
    },
    async saveAuth(providerId?: SiteOAuthProviderId): Promise<void> {
      if (
        !this.managementLoaded ||
        this.saving ||
        (providerId ? !this.oauthCredentialDrafts[providerId] : !this.authDirty)
      )
        return;
      this.saving = true;
      const descriptor = providerId ? SITE_OAUTH_PROVIDERS[providerId] : undefined;
      try {
        const payload = providerId ? this.writableOAuthAuth(providerId) : this.writableAuthBase();
        const auth = await this.enqueueUpdate(payload);
        this.applySavedAuth(auth, providerId);
        await this.$store.dispatch('getSite');
        ElMessage.success(this.$t(descriptor?.savedKey || 'common.message.saved'));
      } catch {
        ElMessage.error(this.$t(descriptor?.saveErrorKey || 'site.error.authSettingsSave'));
      } finally {
        this.saving = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.auth-settings {
  container: auth-settings / inline-size;
}

.auth-save-actions {
  display: flex;
  justify-content: flex-end;
}

// Auth controls have intrinsic widths, so size these rows against the content pane rather than the viewport.
.auth-settings :deep(.settings-item) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  .settings-label,
  .settings-content {
    min-width: 0;
  }

  .settings-content {
    width: 100%;
  }
}

.auth-providers-list {
  width: min(100%, 220px);
  min-width: 0;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
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
  width: min(100%, 240px);
  min-width: 0;
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

@container auth-settings (max-width: 560px) {
  .auth-settings :deep(.settings-item) {
    grid-template-columns: minmax(0, 1fr);

    .settings-content {
      align-items: flex-start;
      text-align: left;
    }
  }
}
</style>
