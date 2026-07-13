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
        <p class="settings-title">{{ $t('common.settings.sendShortcut') }}</p>
      </div>
      <div class="settings-content">
        <send-shortcut />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ThemeSwitcher from '@/components/user/Theme.vue';
import LocaleSwitcher from '@/components/user/Locale.vue';
import SendShortcut from '@/components/user/SendShortcut.vue';

export default defineComponent({
  name: 'GeneralSettings',
  components: {
    ThemeSwitcher,
    LocaleSwitcher,
    SendShortcut
  }
});
</script>
