<template>
  <div class="center">
    <div @click="toggleMenu">
      <user-avatar class="cursor-pointer" />
    </div>
    <transition name="fade">
      <el-card v-if="showMenu" class="absolute right-0 mt-2 min-w-[220px] z-50 p-0">
        <div v-if="user.email" class="px-4 py-2 text-sm font-medium">
          {{ user?.email }}
        </div>
        <el-divider v-if="user.email" class="mb-1 mt-1" />
        <div class="py-1">
          <button class="block w-full px-4 py-2 text-left text-sm rounded-lg" @click="onSettings">
            <font-awesome-icon icon="fa-solid fa-cog" class="mr-1" />
            {{ $t('common.nav.setting') }}
          </button>
          <button class="block w-full px-4 py-2 text-left text-sm rounded-lg" @click="onDistribution">
            <font-awesome-icon icon="fa-solid fa-coins" class="mr-1" />
            {{ $t('common.nav.distribution') }}
          </button>
          <button class="block w-full px-4 py-2 text-left text-sm rounded-lg" @click="onConsole">
            <font-awesome-icon icon="fa-solid fa-compass" class="mr-1" />
            {{ $t('common.nav.console') }}
          </button>
          <button class="block w-full px-4 py-2 text-left text-sm rounded-lg" @click="onLogout">
            <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="mr-1" />
            {{ $t('common.nav.logOut') }}
          </button>
        </div>
      </el-card>
    </transition>
    <user-setting v-model:visible="showSetting" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import UserAvatar from '@/components/user/Avatar.vue';
import UserSetting from '@/components/user/Setting.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_ROOT, ROUTE_DISTRIBUTION_INDEX } from '@/router';
import { ElDivider, ElCard } from 'element-plus';

export default defineComponent({
  name: 'UserCenter',
  components: { UserAvatar, UserSetting, FontAwesomeIcon, ElDivider, ElCard },
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
