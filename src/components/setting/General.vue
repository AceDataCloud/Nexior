<template>
  <div class="settings-list">
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.theme') }}</p>
      </div>
      <div class="settings-content">
        <theme-switcher />
      </div>
    </section>
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.language') }}</p>
      </div>
      <div class="settings-content">
        <locale-switcher />
      </div>
    </section>
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.background') }}</p>
        <p class="settings-tip">{{ $t('common.settings.backgroundTip') }}</p>
      </div>
      <div class="settings-content settings-content-block">
        <background-setting />
      </div>
    </section>
    <section class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.github') }}</p>
      </div>
      <div class="settings-content">
        <a href="https://github.com/AceDataCloud/Nexior" target="_blank" rel="noopener noreferrer" class="github-link">
          <font-awesome-icon :icon="faGithub" class="icon" />
        </a>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import ThemeSwitcher from '@/components/user/Theme.vue';
import LocaleSwitcher from '@/components/user/Locale.vue';
import BackgroundSetting from '@/components/setting/Background.vue';

export default defineComponent({
  name: 'GeneralSettings',
  components: {
    ThemeSwitcher,
    LocaleSwitcher,
    BackgroundSetting,
    FontAwesomeIcon
  },
  data() {
    return {
      faGithub
    };
  }
});
</script>

<style lang="scss" scoped>
// The new wallpaper row renders a 16:9 preview plus an opacity slider that
// don't fit neatly into the default right-aligned `.settings-content`
// layout shared with the simple Theme / Language / GitHub rows. This
// modifier lets the wallpaper content take full width on its row only.
.settings-content-block {
  display: block;
  flex: 1;
  min-width: 0;
}

.github-link {
  display: inline-flex;
  align-items: center;
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: color 0.3s;

  .icon {
    font-size: 18px;
  }

  &:hover {
    color: var(--el-color-primary);
  }
}
</style>
