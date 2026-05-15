<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />

    <!--
      Section 1: which providers are offered on the login screen.
      Multi-select checkbox group — at least one provider must stay
      enabled, otherwise the user could lock themselves and every
      other end-user out of this site.
    -->
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.authEnabledProviders') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.authEnabledProvidersTip') }}
        </p>
      </div>
      <div class="settings-content auth-providers-content">
        <el-checkbox-group
          :model-value="enabledProviders"
          class="auth-providers-checkboxes"
          @change="onEnabledProvidersChange"
        >
          <el-checkbox
            v-for="option in providerOptions"
            :key="option.value"
            :value="option.value"
            :disabled="isOnlyEnabledProvider(option.value)"
            :label="option.label"
          />
        </el-checkbox-group>
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElCheckbox, ElCheckboxGroup, ElMessage, ElOption, ElSelect } from 'element-plus';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { siteOperator } from '@/operators';
import type { ISiteAuth, ISiteAuthProvider } from '@/models';

// Provider IDs we surface in this tab. The IDs match
// ``IUserPublicRegistrationMethod`` in ``src/models/user.ts`` so the
// values written to ``site.auth.providers`` line up with what
// AuthBackend already understands when the login flow is wired up to
// honour this config. The ``username`` provider is intentionally
// omitted — it's an internal/admin-only mechanism and not something
// site owners should expose to end users.
const PROVIDER_IDS = ['email', 'google', 'github', 'phone', 'wechat'] as const;
type ProviderId = (typeof PROVIDER_IDS)[number];

interface ProviderOption {
  value: ProviderId;
  label: string;
}

export default defineComponent({
  name: 'AuthSetting',
  components: {
    ElCheckbox,
    ElCheckboxGroup,
    ElOption,
    ElSelect,
    SectionNotice
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
  methods: {
    isOnlyEnabledProvider(id: ProviderId): boolean {
      // Lock the last remaining enabled checkbox so the user can't
      // disable every provider at once and leave the site unable to
      // accept any login.
      return this.enabledProviders.length === 1 && this.enabledProviders[0] === id;
    },
    onEnabledProvidersChange(rawValue: unknown) {
      // ``el-checkbox-group`` always emits an array, but ``unknown``
      // here keeps TS happy without a cast at the binding site.
      const value = Array.isArray(rawValue) ? (rawValue as ProviderId[]) : [];
      if (value.length === 0) {
        // Should never happen because the only-enabled checkbox is
        // ``disabled``, but a power user could still mutate state via
        // devtools. Bail out with a toast instead of silently bricking
        // login for the whole site.
        ElMessage.warning(this.$t('site.message.authProvidersAtLeastOne'));
        return;
      }
      const nextEnabled = new Set(value);
      // Build a merged providers map: keep every PROVIDER_IDS entry
      // (so disabling looks like ``{ enabled: false }`` rather than a
      // missing key, which AuthBackend can disambiguate from "site
      // hasn't been initialised yet"), and preserve any unknown keys
      // so a future provider this UI doesn't yet know about isn't
      // silently dropped on every save.
      const nextProviders: Record<string, ISiteAuthProvider> = { ...(this.providers || {}) };
      for (const id of PROVIDER_IDS) {
        nextProviders[id] = {
          ...(nextProviders[id] || {}),
          enabled: nextEnabled.has(id)
        };
      }
      // If the current default just got disabled, auto-promote the
      // first remaining enabled provider so ``default ∈ enabled``
      // stays invariant.
      let nextDefault = this.defaultProvider;
      if (!nextDefault || !nextEnabled.has(nextDefault as ProviderId)) {
        nextDefault = PROVIDER_IDS.find((id) => nextEnabled.has(id)) || value[0];
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
    persistAuth(nextAuth: ISiteAuth) {
      const payload = {
        ...this.site,
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
.auth-providers-content {
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.auth-providers-checkboxes {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: 8px;
  column-gap: 16px;
}

.auth-default-provider-select {
  min-width: 200px;
}

@media (max-width: 640px) {
  .auth-providers-checkboxes {
    justify-content: flex-start;
  }

  .auth-providers-content {
    align-items: flex-start;
  }
}
</style>
