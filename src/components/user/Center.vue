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
          <el-dropdown-item class="py-2" @click="onDownload">
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
          <el-dropdown-item class="py-2" @click="onConnectors">
            <font-awesome-icon icon="fa-solid fa-plug" class="mr-2" />
            {{ $t('common.nav.connections') }}
          </el-dropdown-item>
          <el-dropdown-item v-if="showSubsite" class="py-2" @click="onSubsite">
            <font-awesome-icon icon="fa-solid fa-sitemap" class="mr-2" />
            {{ $t('common.nav.subsite') }}
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
  <user-setting v-model:visible="showSetting" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import UserAvatar from '@/components/user/Avatar.vue';
import UserSetting from '@/components/user/Setting.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_ROOT, ROUTE_DISTRIBUTION_INDEX, ROUTE_DOWNLOAD, ROUTE_SUBSITE_INDEX } from '@/router';
import { withCurrentUserId } from '@/utils';
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
      showSetting: false
    };
  },
  computed: {
    user() {
      return this.$store.getters?.user;
    },
    showSubsite() {
      // Hostname-driven gate: any host whose Site row is intended to expose
      // subsite (white-label) management surfaces the menu entry.
      // PlatformBackend #382 enforces the real authorization on POST /sites/,
      // so the worst case here is a logged-in user clicking through to a UI
      // that returns 403 — cheap, and hugely better than the previous
      // failure mode where a stale persisted `state.site` (without
      // `features.subsite`) silently hid the entry on a subsite-enabled
      // origin.
      if (typeof window === 'undefined' || !window.location?.host) return false;
      const host = window.location.host.split(':')[0];
      return host === 'studio.acedata.cloud' || host.endsWith('.studio.acedata.cloud');
    }
  },
  mounted() {
    document.addEventListener('click', this.closeMenu);
  },
  unmounted() {
    document.removeEventListener('click', this.closeMenu);
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
    onConnectors() {
      // Connections are managed exclusively at auth.acedata.cloud.
      // Append `?user_id=` so a cross-site identity mismatch is detected
      // and the user is bounced through SSO if needed.
      window.open(withCurrentUserId('https://auth.acedata.cloud/user/connections'), '_blank', 'noopener');
    },
    onDistribution() {
      this.$router.push({
        name: ROUTE_DISTRIBUTION_INDEX
      });
    },
    onSubsite() {
      this.$router.push({
        name: ROUTE_SUBSITE_INDEX
      });
    },
    onSettings() {
      this.showSetting = true;
    }
  }
});
</script>
