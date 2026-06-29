<template>
  <div class="local-tools-page">
    <h2>{{ $t('common.settings.localTools') }}</h2>
    <local-tools-setting />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LocalToolsSetting from '@/components/setting/LocalTools.vue';

// Standalone route (/settings/local-tools) kept as a thin wrapper over the
// shared panel so there's a single source of truth — the same component also
// renders as the "Local Tools" tab inside the user-settings dialog.
export default defineComponent({
  name: 'SettingsLocalTools',
  components: { LocalToolsSetting }
});
</script>

<style scoped>
.local-tools-page {
  padding: 24px;
  max-width: 760px;
}
.local-tools-page h2 {
  margin: 0 0 16px;
}
</style>
