<template>
  <el-row class="header">
    <el-col :md="4" :xs="24" class="brand-col">
      <logo @click="onHome" />
    </el-col>
    <el-col :md="16" :xs="13">
      <el-menu :default-active="active" mode="horizontal" class="menu" :ellipsis="true" @select="onSelect">
        <el-sub-menu :index="products">
          <template #title>{{ $t('common.nav.products') }}</template>
          <el-menu-item v-if="site?.features?.chatgpt?.enabled" v-t="'index.title.chat'" index="/chat"></el-menu-item>
          <el-menu-item
            v-if="site?.features?.midjourney?.enabled"
            v-t="'index.title.midjourney'"
            index="/midjourney"
          ></el-menu-item>
          <el-menu-item v-if="site?.features?.qrart?.enabled" v-t="'index.title.qrart'" index="/qrart"></el-menu-item>
          <el-menu-item v-if="site?.features?.suno?.enabled" v-t="'index.title.suno'" index="/suno"></el-menu-item>
          <el-menu-item v-if="site?.features?.luma?.enabled" v-t="'index.title.luma'" index="/luma"></el-menu-item>
          <el-menu-item
            v-if="site?.features?.headshots?.enabled"
            v-t="'index.title.headshots'"
            index="/headshots"
          ></el-menu-item>
        </el-sub-menu>
        <el-menu-item v-t="'common.nav.mobileApp'" @route="undefined" @click="onDownload"></el-menu-item>
        <el-menu-item
          v-t="'common.nav.apiPlatform'"
          @route="undefined"
          @click="openTab('https://platform.acedata.cloud')"
        ></el-menu-item>
        <el-menu-item
          v-t="'common.nav.support'"
          @route="undefined"
          @click="openTab('https://platform.acedata.cloud/support')"
        ></el-menu-item>
        <el-menu-item
          v-t="'common.nav.referral'"
          @route="undefined"
          @click="openTab('https://platform.acedata.cloud/earning')"
        ></el-menu-item>
      </el-menu>
    </el-col>
    <el-col :md="4" :xs="11">
      <div v-if="!authenticated" class="mt-4 pr-10">
        <el-button type="primary" class="float-right" size="small" round @click="onLogin">{{
          $t('common.button.login')
        }}</el-button>
        <language-selector class="locale float-right mr-4" />
        <dark-selector class="float-right mr-4" />
      </div>
      <div v-else class="float-right">
        <div class="console" @click="onConsole">
          {{ $t('common.button.console') }}
        </div>
        <el-dropdown trigger="click">
          <img :src="user?.avatar || defaultAvatar" class="avatar" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="onProfile">{{ $t('common.button.profile') }}</el-dropdown-item>
              <el-dropdown-item @click="onLogout">{{ $t('common.button.logout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import defaultAvatar from '@/assets/images/avatar.png';
import { getBaseUrlAuth } from '@/utils';
import { ROUTE_AUTH_LOGIN, ROUTE_CONSOLE_ROOT, ROUTE_DOWNLOAD, ROUTE_INDEX } from '@/router';
import { ElCol, ElRow, ElDropdown, ElMenu, ElSubMenu, ElMenuItem, ElDropdownItem, ElButton } from 'element-plus';
import Logo from './Logo.vue';

export default defineComponent({
  name: 'TopHeader',
  components: {
    ElCol,
    Logo,
    ElRow,
    ElDropdown,
    ElMenu,
    ElMenuItem,
    ElDropdownItem,
    ElButton,
    ElSubMenu
  },
  data() {
    return {
      defaultAvatar,
      products: 'chat'
    };
  },
  computed: {
    site() {
      return this.$store.state?.site;
    },
    dark() {
      return this.$store.getters?.dark;
    },
    active() {
      return this.$route.matched?.[0]?.path;
    },
    user() {
      return this.$store.getters?.user;
    },
    authenticated() {
      return this.$store.getters?.authenticated;
    }
  },
  methods: {
    openTab(url: string) {
      window.open(url, '_blank');
    },
    onSelect(val: string | undefined) {
      if (val) {
        this.$router.push(val);
      }
    },
    onHome() {
      this.$router.push({
        name: ROUTE_INDEX
      });
    },
    onLogin() {
      this.$router.push({
        name: ROUTE_AUTH_LOGIN
      });
    },
    onDownload() {
      this.$router.push({
        name: ROUTE_DOWNLOAD
      });
    },
    onProfile() {
      const baseUrlAuth = getBaseUrlAuth();
      window.open(`${baseUrlAuth}/user/profile`, '_blank');
    },
    onVerify() {
      const baseUrlAuth = getBaseUrlAuth();
      window.open(`${baseUrlAuth}/user/verify`, '_blank');
    },
    onConsole() {
      this.$router.push({
        name: ROUTE_CONSOLE_ROOT
      });
    },
    async onLogout() {
      this.$store.dispatch('logout');
    }
  }
});
</script>

<style lang="scss">
$height: 64px;
.header {
  z-index: 999;
  width: 100%;
  background: rgba(var(--el-bg-color-rgb, 255, 255, 255), 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--app-border-subtle);
  position: sticky;
  top: 0;

  .brand-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-height: $height;
    padding-right: 20px;
  }

  .el-menu.menu {
    --el-menu-hover-bg-color: transparent;
    --el-menu-active-color: var(--el-color-primary);
    background: none;
    border: none;
    height: $height;
    min-width: 300px;
    overflow-x: hidden;

    .el-menu-item {
      height: $height;
      color: var(--el-text-color-regular) !important;
      font-weight: 450;
      transition: color 0.2s;

      &.is-active {
        color: var(--el-color-primary) !important;
        border-bottom: none !important;
      }

      &:hover {
        color: var(--el-color-primary) !important;
        border-bottom: 2px solid var(--el-color-primary) !important;
      }
    }
  }

  .avatar {
    height: 36px;
    width: 36px;
    border-radius: 50%;
    cursor: pointer;
    margin-top: 14px;
    margin-right: 20px;
    margin-left: 10px;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
    }
  }

  .console {
    color: var(--el-text-color-primary) !important;
    height: $height;
    line-height: $height;
    margin: 0 10px;
    font-size: 14px;
    font-weight: 450;
    display: inline-block;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--el-color-primary) !important;
    }
  }

  .locale {
    cursor: pointer;
    display: inline-block;
    margin-left: 10px;
  }
}

html.dark .header {
  background: rgba(11, 13, 23, 0.8);
  border-bottom-color: var(--app-glass-border);
}

@media only screen and (max-width: 768px) {
  .header {
    .brand-col {
      justify-content: center;
      padding-right: 0;
    }
  }
}
</style>
