<template>
  <div class="settings-list">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.origin') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.originTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ site.origin }}</span>
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.title') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.titleTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ titleSource }}</span>
        <div class="settings-actions">
          <edit-text
            :model-value="titleSource"
            :title="$t('site.title.editTitle')"
            :placeholder="$t('site.placeholder.title')"
            @confirm="onSave({ title: $event })"
          />
          <auto-translate-toggle
            model="site"
            field="title"
            :object-id="site.id"
            :enabled="autoTranslatedFields.includes('title')"
            :current-value="titleSource"
            @enabled-success="onTranslationChanged"
            @disabled-success="onTranslationChanged"
          />
        </div>
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.logo') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.logoTip') }}
        </p>
      </div>
      <div class="settings-content">
        <el-image :src="site.logo" class="settings-media" fit="contain" />
        <brand-asset-studio
          kind="logo"
          :title="$t('site.title.editLogo')"
          :tip="$t('site.message.editLogoTip')"
          :width="240"
          :height="72"
          @confirm="onLogoProcessed"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.favicon') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.faviconTip') }}
        </p>
      </div>
      <div class="settings-content">
        <el-image :src="site.favicon" class="settings-media favicon" fit="contain" />
        <brand-asset-studio
          kind="favicon"
          :title="$t('site.title.editFavicon')"
          :tip="$t('site.message.editFaviconTip')"
          :width="128"
          :height="128"
          @confirm="onFaviconProcessed"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.primaryColor') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.primaryColorTip') }}
        </p>
      </div>
      <div class="settings-content primary-color-content">
        <el-color-picker
          :model-value="currentPrimaryColor"
          color-format="hex"
          :predefine="primaryColorPresets"
          @change="onPrimaryColorPicked"
        />
        <span class="settings-value primary-color-value">{{ currentPrimaryColor }}</span>
        <el-button v-if="hasCustomPrimaryColor" link type="primary" @click="onPrimaryColorReset">
          {{ $t('site.button.resetPrimaryColor') }}
        </el-button>
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.supportedLocales') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.supportedLocalesTip') }}
        </p>
      </div>
      <div class="settings-content">
        <span class="settings-value">{{ supportedLocalesSummary }}</span>
        <edit-locales
          :model-value="supportedLocaleValues"
          :title="$t('site.title.editSupportedLocales')"
          @confirm="onSaveSupportedLocales"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.forcedLocale') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.forcedLocaleTip') }}
        </p>
      </div>
      <div class="settings-content">
        <el-select
          :model-value="forcedLocaleValue"
          class="forced-locale-select"
          clearable
          :placeholder="$t('site.placeholder.autoDetectLocale')"
          @update:model-value="onSaveForcedLocale"
        >
          <el-option
            v-for="locale in forcedLocaleOptions"
            :key="locale.value"
            :label="locale.label"
            :value="locale.value"
          />
        </el-select>
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.admins') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.adminsTip') }}
        </p>
      </div>
      <div class="settings-content">
        <div class="admins-list">
          <user-chip v-for="adminId in site.admins || []" :key="adminId" :user-id="adminId" class="admins-chip" />
        </div>
        <edit-users
          :model-value="site?.admins || []"
          :title="$t('site.title.editAdmins')"
          :min="1"
          :min-error-message="$t('site.message.atLeastOneAdmin')"
          @confirm="onSave({ admins: $event })"
        />
      </div>
    </section>

    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('site.field.contacts') }}</p>
        <p class="settings-tip">
          {{ $t('site.message.contactsTip') }}
        </p>
      </div>
      <div class="settings-content">
        <div v-if="hasContacts" class="contacts-summary">
          <el-tag v-for="(c, i) in contacts" :key="i" size="small" round class="contact-chip">
            <font-awesome-icon v-if="contactUsesFontAwesome(c.type)" :icon="contactIconFor(c.type)" class="chip-icon" />
            <component
              :is="contactIconFor(c.type)"
              v-else
              class="chip-icon"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
            {{ contactSummary(c) }}
          </el-tag>
        </div>
        <span v-else class="settings-value">{{ $t('site.message.contactsEmpty') }}</span>
        <edit-contacts :model-value="contacts" :title="$t('site.title.editContacts')" @confirm="onSaveContacts" />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElColorPicker, ElImage, ElOption, ElSelect, ElTag } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import EditText from '@/components/site/EditText.vue';
import BrandAssetStudio, { type BrandAssetStudioResult } from '@/components/site/BrandAssetStudio.vue';
import EditUsers from '@/components/site/EditUsers.vue';
import EditLocales from '@/components/site/EditLocales.vue';
import EditContacts from '@/components/site/EditContacts.vue';
import UserChip from '@/components/site/UserChip.vue';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { siteOperator } from '@/operators';
import { getBrandContacts, hasBrandContacts, toWritableSitePayload } from '@/utils';
import { contactIcon, contactBrand, contactTypeI18nKey, contactUsesFontAwesome } from '@/utils/contactTypes';
import { ISiteContact } from '@/models';
import { DEFAULT_PRIMARY_COLOR, applyAccentColor } from '@/utils/theme';
import { I18N_SUPPORTED_LOCALES } from '@/constants/i18n';
import { getSiteLocaleOptions } from '@/utils/siteLocales';

// A small curated palette to make picking a "good" colour easy. The picker
// still accepts any hex via its colour wheel; these are just shortcuts.
const PRIMARY_COLOR_PRESETS = [
  '#277186', // Ace Data Cloud teal (default)
  '#0ea5e9', // sky blue
  '#2563eb', // brand blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#dc2626', // red
  '#ea580c', // orange
  '#16a34a', // emerald
  '#0d9488', // teal
  '#475569' // slate
];

export default defineComponent({
  name: 'SiteSetting',
  components: {
    EditText,
    BrandAssetStudio,
    EditUsers,
    EditLocales,
    EditContacts,
    UserChip,
    AutoTranslateToggle,
    ElButton,
    ElColorPicker,
    ElImage,
    ElOption,
    ElSelect,
    ElTag,
    FontAwesomeIcon,
    SectionNotice
  },
  data() {
    return {
      primaryColorPresets: PRIMARY_COLOR_PRESETS
    };
  },
  computed: {
    site() {
      return this.$store.getters.site || {};
    },
    // Raw zh-cn source for ``title``. When auto-translate is OFF the
    // server echoes the literal back in ``title_source``; when ON the
    // ``title`` column is a ``$t(...)`` ref evaluated to the viewer's
    // locale, so we always edit the source value to avoid clobbering
    // the zh-cn original with a rendered English/etc. string.
    titleSource(): string {
      return this.site?.title_source ?? this.site?.title ?? '';
    },
    autoTranslatedFields(): string[] {
      return this.site?.auto_translated_fields ?? [];
    },
    storedPrimaryColor(): string | undefined {
      return this.site?.theme?.primary_color;
    },
    currentPrimaryColor(): string {
      return this.storedPrimaryColor || DEFAULT_PRIMARY_COLOR;
    },
    hasCustomPrimaryColor(): boolean {
      const c = this.storedPrimaryColor;
      return !!c && c.toLowerCase() !== DEFAULT_PRIMARY_COLOR.toLowerCase();
    },
    supportedLocaleValues(): string[] {
      return this.site?.supported_locales?.length
        ? [...this.site.supported_locales]
        : I18N_SUPPORTED_LOCALES.map((locale) => locale.value);
    },
    supportedLocalesSummary(): string {
      if (!this.site?.supported_locales?.length) return this.$t('site.message.allLocales') as string;
      const selected = new Set(this.site.supported_locales);
      return I18N_SUPPORTED_LOCALES.filter((locale) => selected.has(locale.value))
        .map((locale) => locale.label)
        .join('、');
    },
    contacts(): ISiteContact[] {
      return getBrandContacts(this.site);
    },
    forcedLocaleValue(): string {
      return this.site?.forced_locale || '';
    },
    forcedLocaleOptions() {
      // Only languages the site actually offers — the backend rejects pinning
      // one that isn't in supported_locales.
      return getSiteLocaleOptions(this.site?.supported_locales);
    },
    hasContacts(): boolean {
      return hasBrandContacts(this.site);
    }
  },
  methods: {
    contactUsesFontAwesome,
    contactIconFor(type: string) {
      return contactIcon(type);
    },
    contactSummary(c: ISiteContact): string {
      // Short chip label: prefer the owner's label, then the value, then a
      // brand/type name.
      if (c.label) return c.label;
      if (c.value) return c.value;
      const brand = contactBrand(c.type);
      if (brand) return brand;
      const key = contactTypeI18nKey(c.type);
      return key ? (this.$t(key) as string) : c.type;
    },
    onLogoProcessed(result: BrandAssetStudioResult) {
      this.onSave({ logo: result.color, logo_light: result.light, logo_dark: result.dark });
    },
    onFaviconProcessed(result: BrandAssetStudioResult) {
      this.onSave({ favicon: result.color });
    },
    onSave(data: any) {
      const payload = {
        ...toWritableSitePayload(this.site),
        ...data
      };
      siteOperator.update(this.site?.id, payload).then(() => {
        console.debug('getSite for id', this.site?.id);
        this.$store.dispatch('getSite');
      });
    },
    onSaveContacts(contacts: ISiteContact[]) {
      // Merge into the existing branding so other white-label keys
      // (company / links / hide_*) are preserved. Drop the key entirely
      // when cleared so ``Site.branding`` stays tidy.
      const branding = { ...(this.site?.branding || {}) };
      if (Array.isArray(contacts) && contacts.length > 0) {
        branding.contacts = contacts;
      } else {
        delete branding.contacts;
      }
      this.onSave({ branding });
    },
    onSaveSupportedLocales(locales: string[]) {
      const supportedLocales = locales.length === I18N_SUPPORTED_LOCALES.length ? null : locales;
      const payload: Record<string, unknown> = { supported_locales: supportedLocales };
      // Dropping the pinned language from the offered set would fail the
      // backend's cross-field check, so clear the pin along with it.
      const forced = this.site?.forced_locale;
      if (forced && supportedLocales && !supportedLocales.includes(forced)) {
        payload.forced_locale = null;
      }
      this.onSave(payload);
    },
    onSaveForcedLocale(locale: string | null) {
      this.onSave({ forced_locale: locale || null });
    },
    onTranslationChanged() {
      // Toggle endpoints mutate the row server-side; refresh so the
      // ``title`` / ``title_source`` / ``auto_translated_fields`` we
      // bind to come back in sync.
      this.$store.dispatch('getSite');
    },
    onPrimaryColorPicked(value: string | null) {
      // `el-color-picker` emits `null` if the user clears the swatch and
      // a `#xxxxxx` hex otherwise. Either way we route through the same
      // theme merge as the explicit Reset button.
      const next = value || undefined;
      this.persistPrimaryColor(next);
    },
    onPrimaryColorReset() {
      this.persistPrimaryColor(undefined);
    },
    persistPrimaryColor(hex: string | undefined) {
      // Apply optimistically for a live preview; the server save happens
      // through the same `siteOperator.update` path as every other field
      // on this page so any 4xx will be surfaced the same way.
      applyAccentColor(hex || null);
      const nextTheme: { primary_color?: string } = {
        ...(this.site?.theme || {}),
        primary_color: hex
      };
      // Drop the key entirely when reverting to default so we don't pile
      // up `{ primary_color: undefined }` entries in `Site.theme` (the
      // backend validator also rejects unknown keys, so keeping the
      // shape clean is important).
      if (!hex) delete nextTheme.primary_color;
      this.onSave({ theme: nextTheme });
    }
  }
});
</script>

<style lang="scss" scoped>
.settings-media {
  max-width: 120px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
}

.settings-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.favicon {
  max-width: 64px;
}

.admins-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  max-width: 100%;
}

.admins-chip {
  max-width: 100%;
}

.contacts-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 100%;

  .contact-chip {
    max-width: 100%;

    .chip-icon {
      margin-right: 5px;
      font-size: 11px;
    }
  }
}

.primary-color-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .primary-color-value {
    font-family: var(--el-font-family-monospace, 'SFMono-Regular', Menlo, Consolas, monospace);
    font-size: 13px;
    color: var(--el-text-color-regular);
    text-transform: uppercase;
  }
}

.forced-locale-select {
  width: 200px;
  max-width: 100%;
}

@media (max-width: 640px) {
  .admins-list {
    align-items: flex-start;
  }
}
</style>
