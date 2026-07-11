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
    <section v-if="showLoginMode" class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.loginMode') }}</p>
      </div>
      <div class="settings-content">
        <login-mode-switcher />
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
import LoginModeSwitcher from '@/components/user/LoginMode.vue';
import { isNative, isDesktop } from '@/utils/surface';

export default defineComponent({
  name: 'GeneralSettings',
  components: {
    ThemeSwitcher,
    LocaleSwitcher,
    LoginModeSwitcher,
    FontAwesomeIcon
  },
  data() {
    return {
      faGithub
    };
  },
  computed: {
    // Native / desktop always use the in-app iframe (a redirect can't return
    // to an app://bundle window), so the choice only makes sense on web.
    showLoginMode(): boolean {
      return !isNative() && !isDesktop();
    }
  }
});
</script>

<style lang="scss" scoped>
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
