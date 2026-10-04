<template>
  <div class="settings-page" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// `/settings` has no real page of its own — it just opens the user
// settings dialog (`@/components/user/Setting.vue`) that's already
// mounted inside `UserCenter` in the Main layout's Navigator. We dispatch
// the `open-user-settings` CustomEvent with the requested tab.
export default defineComponent({
  name: 'SettingsIndex',
  mounted() {
    const tab = (this.$route.query.tab as string) || '';
    window.dispatchEvent(new CustomEvent('open-user-settings', { detail: { tab } }));
  }
});
</script>
