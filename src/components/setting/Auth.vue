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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElOption, ElSelect, ElSwitch } from 'element-plus';
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
    ElOption,
    ElSelect,
    ElSwitch,
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
</style>
