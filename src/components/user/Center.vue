<template>
  <div class="relative inline-block text-left">
    <div @click="toggleMenu">
      <user-avatar class="w-10 h-10 cursor-pointer" />
    </div>
    <transition name="fade">
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 min-w-[220px] rounded-2xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 z-50 p-2"
      >
        <div class="px-4 py-2 text-sm font-medium text-gray-900 border-b">
          {{ user?.email || '未登录用户' }}
        </div>
        <div class="py-1">
          <button
            class="block w-full px-4 py-2 text-left text-sm text-gray-800 rounded-lg hover:bg-gray-100"
            @click="onSettings"
          >
            <font-awesome-icon icon="fa-solid fa-cog" class="mr-1 text-gray-600" />
            {{ $t('common.button.setup') }}
          </button>
          <button
            class="block w-full px-4 py-2 text-left text-sm text-gray-800 rounded-lg hover:bg-gray-100"
            @click="onLogout"
          >
            <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="mr-1 text-gray-600" />
            {{ $t('common.nav.logOut') }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import UserAvatar from '@/components/user/Avatar.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_ROOT } from '@/router';

export default defineComponent({
  name: 'UserCenter',
  components: { UserAvatar, FontAwesomeIcon },
  data() {
    return {
      showMenu: false
    };
  },
  computed: {
    user() {
      return this.$store.getters?.user;
    }
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
    onUpgrade() {
      console.log('点击升级套餐');
    },
    onCustomize() {
      console.log('点击自定义');
    },
    onSettings() {
      console.log('点击设置');
    },
    onHelp() {
      console.log('点击帮助');
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
