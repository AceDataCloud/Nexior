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
    <section v-if="canDeleteAccount" class="settings-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.account') }}</p>
      </div>
      <div class="settings-content">
        <button type="button" class="delete-account-action" @click="$emit('delete-account')">
          {{ $t('common.nav.deleteAccount') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ThemeSwitcher from '@/components/user/Theme.vue';
import LocaleSwitcher from '@/components/user/Locale.vue';
import SendShortcut from '@/components/user/SendShortcut.vue';
import { isIOS } from '@/utils/surface';

export default defineComponent({
  name: 'GeneralSettings',
  components: {
    ThemeSwitcher,
    LocaleSwitcher,
    SendShortcut
  },
  emits: ['delete-account'],
  computed: {
    canDeleteAccount(): boolean {
      return isIOS() && !!this.$store.getters?.authenticated;
    }
  }
});
</script>

<style lang="scss" scoped>
.delete-account-action {
  display: inline-flex;
  align-items: flex-start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  cursor: pointer;

  &:hover {
    color: var(--el-color-danger);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 3px;
    border-radius: 2px;
  }
}
</style>
