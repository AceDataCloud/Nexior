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
        <span class="settings-value">{{ site.title }}</span>
        <edit-text
          :model-value="site.title"
          :title="$t('site.title.editTitle')"
          :placeholder="$t('site.placeholder.title')"
          @confirm="onSave({ title: $event })"
        />
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
        <edit-image
          :model-value="site.logo"
          :title="$t('site.title.editLogo')"
          :tip="$t('site.message.editLogoTip')"
          :width="240"
          :height="72"
          @confirm="onSave({ logo: $event })"
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
        <edit-image
          :model-value="site.favicon"
          :title="$t('site.title.editFavicon')"
          :tip="$t('site.message.editFaviconTip')"
          :width="128"
          :height="128"
          @confirm="onSave({ favicon: $event })"
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
        <p class="settings-title">{{ $t('common.settings.background') }}</p>
        <p class="settings-tip">
          {{ $t('common.settings.backgroundTip') }}
        </p>
      </div>
      <div class="settings-content settings-content-block">
        <background-setting />
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElColorPicker, ElImage } from 'element-plus';
import EditText from '@/components/site/EditText.vue';
import EditImage from '@/components/site/EditImage.vue';
import EditUsers from '@/components/site/EditUsers.vue';
import UserChip from '@/components/site/UserChip.vue';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import BackgroundSetting from '@/components/setting/Background.vue';
import { siteOperator } from '@/operators';
import { DEFAULT_PRIMARY_COLOR, applyAccentColor } from '@/utils/theme';

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
    EditImage,
    EditUsers,
    UserChip,
    ElButton,
    ElColorPicker,
    ElImage,
    SectionNotice,
    BackgroundSetting
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
    storedPrimaryColor(): string | undefined {
      return this.site?.theme?.primary_color;
    },
    currentPrimaryColor(): string {
      return this.storedPrimaryColor || DEFAULT_PRIMARY_COLOR;
    },
    hasCustomPrimaryColor(): boolean {
      const c = this.storedPrimaryColor;
      return !!c && c.toLowerCase() !== DEFAULT_PRIMARY_COLOR.toLowerCase();
    }
  },
  methods: {
    onSave(data: any) {
      const payload = {
        ...this.site,
        ...data
      };
      siteOperator.update(this.site?.id, payload).then(() => {
        console.debug('getSite for id', this.site?.id);
        this.$store.dispatch('getSite');
      });
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

// The wallpaper row renders a 16:9 preview + two sliders that don't fit
// the default right-aligned `.settings-content` layout shared with the
// simple value+EditImage rows above. This modifier lets that one row take
// full width.
.settings-content-block {
  display: block;
  flex: 1;
  min-width: 0;
}

@media (max-width: 640px) {
  .admins-list {
    align-items: flex-start;
  }
}
</style>
