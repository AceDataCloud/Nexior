<template>
  <div class="center">
    <el-dropdown trigger="click">
      <user-avatar class="cursor-pointer" />
      <template #dropdown>
        <div v-if="user.email" class="px-4 py-4 text-sm font-medium">
          {{ user?.email }}
        </div>
        <el-divider v-if="user.email" class="mb-1 mt-1" />
        <el-dropdown-menu>
          <el-dropdown-item v-if="!isNative" class="py-2" @click="onDownload">
            <font-awesome-icon icon="fa-solid fa-mobile-screen-button" class="mr-2" />
            {{ $t('common.nav.mobileApp') }}
          </el-dropdown-item>
          <el-dropdown-item class="py-2" @click="onSettings">
            <font-awesome-icon icon="fa-solid fa-cog" class="mr-2" />
            {{ $t('common.nav.setting') }}
          </el-dropdown-item>
          <el-dropdown-item class="py-2" @click="onDistribution">
            <font-awesome-icon icon="fa-solid fa-coins" class="mr-2" />
            {{ $t('common.nav.distribution') }}
          </el-dropdown-item>

          <el-dropdown-item class="py-2" @click="onConsole">
            <font-awesome-icon icon="fa-solid fa-compass" class="mr-2" />
            {{ $t('common.nav.console') }}
          </el-dropdown-item>
          <el-dropdown-item class="py-2" @click="onLogout">
            <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="mr-2" />
            {{ $t('common.nav.logOut') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
  <user-setting v-model:visible="showSetting" :initial-tab="settingTab" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import UserAvatar from '@/components/user/Avatar.vue';
import UserSetting from '@/components/user/Setting.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_ROOT, ROUTE_DISTRIBUTION_INDEX, ROUTE_DOWNLOAD } from '@/router';
import { isNative as isNativeSurface } from '@/utils/surface';
import { ElDivider } from 'element-plus';
import { ElDropdownMenu, ElDropdownItem, ElDropdown } from 'element-plus';

export default defineComponent({
  name: 'UserCenter',
  components: {
    UserAvatar,
    UserSetting,
    FontAwesomeIcon,
    ElDivider,
    ElDropdownMenu,
    ElDropdownItem,
    ElDropdown
  },
  data() {
    return {
      showMenu: false,
      showSetting: false,
      settingTab: ''
    };
  },
  computed: {
    user() {
      return this.$store.getters?.user;
    },
    isNative() {
      return isNativeSurface();
    }
  },
  mounted() {
    document.addEventListener('click', this.closeMenu);
    // Other components (e.g. the in-chat BYOK badge) ask UserCenter to
    // open the settings dialog at a specific tab via this CustomEvent
    // — we own the only mounted `<user-setting>` instance.
    window.addEventListener('open-user-settings', this.onOpenSettingsEvent as EventListener);
    // Cross-site entry: the parent's subsite-management "Manage" button
    // links here as `https://<subsite>/?dialog=settings[&tab=...]`. The
    // root redirect preserves the query through the default-route hop,
    // so by the time UserCenter mounts the flag is on `$route.query`.
    // We pop the settings dialog automatically and (optionally) jump to
    // a specific tab.
    this.maybeOpenFromQuery();
  },
  unmounted() {
    document.removeEventListener('click', this.closeMenu);
    window.removeEventListener('open-user-settings', this.onOpenSettingsEvent as EventListener);
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    closeMenu(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!this.$el.contains(target)) {
        this.showMenu = false;
      }
    },
    async onLogout() {
      await this.$store.dispatch('logout');
    },
    onDownload() {
      this.$router.push({ name: ROUTE_DOWNLOAD });
    },
    onConsole() {
      this.$router.push({ name: ROUTE_CONSOLE_ROOT });
    },
    onDistribution() {
      this.$router.push({
        name: ROUTE_DISTRIBUTION_INDEX
      });
    },
    onSettings() {
      this.settingTab = '';
      this.showSetting = true;
    },
    onOpenSettingsEvent(event: CustomEvent<{ tab?: string }>) {
      this.settingTab = event?.detail?.tab ?? '';
      this.showSetting = true;
    },
    /**
     * If the current URL carries `?dialog=settings`, auto-open the user
     * settings dialog. Optional `?tab=<key>` selects a specific tab
     * (same key space as `SETTING_TAB_*` constants). The query is left
     * in the URL on purpose — the user explicitly asked for it to stick
     * around so a manual refresh re-opens the dialog.
     *
     * Falls back to `window.location.search` if `$route.query` hasn't
     * been populated yet (some early-mount edge cases on hash/history
     * mode), so the flag is detected reliably either way.
     */
    maybeOpenFromQuery() {
      const routeQuery = (this.$route?.query ?? {}) as Record<string, string | string[] | undefined>;
      let dialog = routeQuery.dialog;
      let tab = routeQuery.tab;
      if (!dialog && window.location?.search) {
        const params = new URLSearchParams(window.location.search);
        dialog = params.get('dialog') ?? undefined;
        if (!tab) tab = params.get('tab') ?? undefined;
      }
      const dialogValue = Array.isArray(dialog) ? dialog[0] : dialog;
      if (dialogValue !== 'settings') return;
      const tabValue = Array.isArray(tab) ? tab[0] : tab;
      this.settingTab = typeof tabValue === 'string' ? tabValue : '';
      this.showSetting = true;
    }
  }
});
</script>
