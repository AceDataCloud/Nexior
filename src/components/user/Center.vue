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
          <el-dropdown-item class="py-2" @click="onSettings">
            <font-awesome-icon icon="fa-solid fa-cog" class="mr-1" />
            {{ $t('common.nav.setting') }}
          </el-dropdown-item>
          <el-dropdown-item class="py-2" @click="onDistribution">
            <font-awesome-icon icon="fa-solid fa-coins" class="mr-1" />
            {{ $t('common.nav.distribution') }}
          </el-dropdown-item>
          <el-dropdown-item class="py-2" @click="onConsole">
            <font-awesome-icon icon="fa-solid fa-compass" class="mr-1" />
            {{ $t('common.nav.console') }}
          </el-dropdown-item>
          <el-dropdown-item class="py-2" @click="onLogout">
            <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="mr-1" />
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
import { ROUTE_CONSOLE_ROOT, ROUTE_DISTRIBUTION_INDEX } from '@/router';
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
    onConsole() {
      this.$router.push({ name: ROUTE_CONSOLE_ROOT });
    },
    onDistribution() {
      this.$router.push({
        name: ROUTE_DISTRIBUTION_INDEX
      });
    },
    onSettings() {
      this.showSetting = true;
    }
  }
});
</script>
