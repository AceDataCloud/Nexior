<template>
  <div class="flex justify-between items-center mb-4">
    <label class="block mb-2 text-sm font-medium">{{ $t('common.settings.theme') }}</label>
    <theme-switcher />
  </div>
  <div class="flex justify-between items-center mb-4">
    <label class="block mb-2 text-sm font-medium">{{ $t('common.settings.language') }}</label>
    <locale-switcher />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ThemeSwitcher from '@/components/user/Theme.vue';
import LocaleSwitcher from '@/components/user/Locale.vue';

export default defineComponent({
  name: 'GeneralSettings',
  components: {
    ThemeSwitcher,
    LocaleSwitcher
  }
});
</script>
