<template>
  <div class="navigator">
    <chevron v-if="collapsed" class="chevron" direction="right" @click="onOpenMenu"></chevron>
    <chevron v-else class="chevron" direction="left" @click="onCollapseMenu"></chevron>
    <div class="top">
      <div v-if="!collapsed">
        <img src="@/assets/images/logo.svg" class="logo" @click="onHome" />
      </div>
      <el-menu v-if="!collapsed" :default-active="activeIndex">
        <el-menu-item
          v-for="(link, linkIndex) in links"
          :key="linkIndex"
          :index="link.route.name"
          @click="$router.push(link.route)"
        >
          <font-awesome-icon :icon="link.icon" class="mr-2" />
          <template #title>{{ link.displayName }}</template>
        </el-menu-item>
      </el-menu>
      <div v-for="(link, linkIndex) in links" v-else :key="linkIndex" class="link">
        <el-tooltip v-if="collapsed" effect="dark" :content="link.displayName" placement="right">
          <el-button
            :class="{button: true, active: link.routes.includes($route.name as string)}"
            @click="$router.push(link.route)"
          >
            <font-awesome-icon :icon="link.icon" />
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <div class="middle" />
    <div v-if="!collapsed" class="bottom">
      <el-menu :default-active="activeIndex">
        <el-menu-item v-if="$config.navigation?.console" @click="onConsole">
          <font-awesome-icon icon="fa-solid fa-compass" class="mr-2" />
          <template #title>{{ $t('common.nav.console') }}</template>
        </el-menu-item>
        <el-menu-item v-if="showDistribution" @click="onDistribution">
          <font-awesome-icon icon="fa-solid fa-coins" class="mr-2" />
          <template #title>{{ $t('common.nav.distribution') }}</template>
        </el-menu-item>
        <el-menu-item v-if="authenticated" @click="onLogout">
          <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" class="mr-2" />
          <template #title>{{ $t('common.nav.logOut') }}</template>
        </el-menu-item>
      </el-menu>
    </div>
    <div v-else class="bottom">
      <div v-if="$config.navigation?.console" class="link">
        <el-tooltip effect="dark" :content="$t('common.nav.console')" placement="right">
          <el-button class="button" @click="onConsole">
            <font-awesome-icon icon="fa-solid fa-compass" />
          </el-button>
        </el-tooltip>
      </div>
      <div v-if="showDistribution" class="link">
        <el-tooltip effect="dark" :content="$t('common.nav.distribution')" placement="right">
          <el-button class="button" @click="onDistribution">
            <font-awesome-icon icon="fa-solid fa-coins" />
          </el-button>
        </el-tooltip>
      </div>
      <div v-if="authenticated" class="link">
        <el-tooltip effect="dark" :content="$t('common.nav.logOut')" placement="right">
          <el-button class="button" @click="onLogout">
            <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" />
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElTooltip, ElMenu, ElMenuItem } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  ROUTE_CHAT_CONVERSATION,
  ROUTE_CHAT_CONVERSATION_NEW,
  ROUTE_CONSOLE_ROOT,
  ROUTE_DISTRIBUTION_INDEX,
  ROUTE_INDEX,
  ROUTE_MIDJOURNEY_HISTORY,
  ROUTE_MIDJOURNEY_INDEX
} from '@/router/constants';
import HelpEntry from './HelpEntry2.vue';
import Chevron from './Chevron.vue';

export default defineComponent({
  name: 'Navigator',
  components: {
    ElButton,
    ElTooltip,
    FontAwesomeIcon,
    ElMenu,
    ElMenuItem,
    Chevron
  },
  data() {
    const links = [];
    if (this.$config?.navigation?.chat) {
      links.push({
        route: {
          name: ROUTE_CHAT_CONVERSATION_NEW
        },
        displayName: this.$t('common.nav.chat'),
        icon: 'fa-regular fa-comment',
        image: 'https://cdn.zhishuyun.com/9ad12c99b2.png/thumb_100x100',
        routes: [ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW]
      });
    }
    if (this.$config.navigation?.midjourney) {
      links.push({
        route: {
          name: ROUTE_MIDJOURNEY_INDEX
        },
        displayName: this.$t('common.nav.midjourney'),
        icon: 'fa-solid fa-palette',
        image: 'https://cdn.zhishuyun.com/83ee211091.png/thumb_100x100',
        routes: [ROUTE_MIDJOURNEY_INDEX, ROUTE_MIDJOURNEY_HISTORY]
      });
    }

    return {
      links,
      activeIndex: this.$route.name as string
    };
  },
  computed: {
    authenticated() {
      return !!this.$store.state.token.access;
    },
    showDistribution() {
      return (
        // config is enabled
        this.$config.navigation.distribution &&
        // if forcedInviterId is set, only the forced inviter can see the distribution menu
        // if forcedInviterId is not set, everyone can see the distribution menu
        (!this.$config.distribution?.forceInviterId ||
          this.$store.getters.user?.id === this.$config.distribution?.forceInviterId)
      );
    },
    collapsed: {
      get() {
        return this.$store.state.setting?.navigationCollapsed;
      },
      set(val: boolean) {
        this.$store.commit('setSetting', {
          navigationCollapsed: val
        });
      }
    }
  },
  methods: {
    onHome() {
      this.$router.push({
        name: ROUTE_INDEX
      });
    },
    onDistribution() {
      this.$router.push({
        name: ROUTE_DISTRIBUTION_INDEX
      });
    },
    async onOpenMenu() {
      this.collapsed = false;
    },
    async onCollapseMenu() {
      this.collapsed = true;
    },
    async onLogout() {
      await this.$store.dispatch('resetAll');
      await this.$store.dispatch('chat/resetAll');
      await this.$store.dispatch('midjourney/resetAll');
    },
    onConsole() {
      this.$router.push({ name: ROUTE_CONSOLE_ROOT });
    }
  }
});
</script>

<style lang="scss" scoped>
.navigator {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  .el-menu {
    width: 150px;
    border-right: none;
    .el-menu-item {
      height: 50px;
    }
  }

  .chevron {
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%) scale(0.8);
    z-index: 10;
  }

  .logo {
    width: 80%;
    max-height: 40px;
    cursor: pointer;
    margin: 10px auto 20px auto;
    display: block;
  }

  .top,
  .bottom {
    display: flex;
    flex-direction: column;
    padding-top: 10px;
    .link {
      width: 40px;
      height: 40px;
      margin: 0 10px 10px 10px;
      .button {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: none;
        background-color: var(--el-bg-color-page);
        &.active,
        &:hover,
        &:focus {
          background-color: var(--el-button-hover-bg-color);
          color: var(--el-button-active-text-color);
        }
      }
    }
  }
  .bottom {
    display: block;
    position: absolute;
    bottom: 0;
  }
}
</style>
