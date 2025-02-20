<template>
  <el-row class="header">
    <el-col :md="4" :xs="24">
      <logo @click="onHome" />
    </el-col>
    <el-col :md="16" :xs="13">
      <el-menu :default-active="active" mode="horizontal" class="menu" :ellipsis="true" @select="onSelect">
        <el-sub-menu :index="1">
          <template #title>{{ $t('common.nav.products') }}</template>
          <el-menu-item v-if="site?.features?.chat?.enabled" v-t="'index.title.chat'" index="/chat"></el-menu-item>
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
        <dark-selector />
        <language-selector class="locale" />
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
import { ROUTE_AUTH_LOGIN, ROUTE_CONSOLE_ROOT, ROUTE_INDEX } from '@/router';
import { ElCol, ElRow, ElDropdown, ElMenu, ElSubMenu, ElMenuItem, ElDropdownItem, ElButton } from 'element-plus';
import DarkSelector from './DarkSelector2.vue';
import LanguageSelector from './LanguageSelector.vue';
import Logo from './Logo.vue';

export default defineComponent({
  name: 'TopHeader',
  components: {
    ElCol,
    Logo,
    ElRow,
    DarkSelector,
    ElDropdown,
    ElMenu,
    ElMenuItem,
    ElDropdownItem,
    ElButton,
    ElSubMenu,
    LanguageSelector
  },
  data() {
    return {
      defaultAvatar
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
$height: 60px;
.header {
  z-index: 999;
  width: 100%;
  background: var(--el-bg-color);

  .logo {
    height: 40px;
    width: 120px;
    cursor: pointer;
    margin-top: 8px;
    margin-right: 20px;
    float: right;
  }

  .el-menu.menu {
    --el-menu-hover-bg-color: var(--el-bg-color);
    --el-menu-active-color: var(--el-color-primary);
    background: none;
    border: none;
    height: $height;
    min-width: 300px;
    overflow-x: hidden;
    .el-menu-item {
      height: $height;
      color: inherit !important;
      &.is-active {
        color: inherit !important;
        border-bottom: none !important;
      }
      &:hover {
        border-bottom: 2px solid var(--el-color-primary) !important;
      }
    }
  }

  .avatar {
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    margin-top: 10px;
    margin-right: 20px;
    margin-left: 10px;
  }
  .console {
    color: inherit !important;
    height: 60px;
    line-height: 60px;
    margin: 0 10px;
    font-size: 14px;
    display: inline-block;
    cursor: pointer;
  }
  .locale {
    cursor: pointer;
    display: inline-block;
    margin-left: 10px; // Add left margin if needed
  }
}
@media only screen and (max-width: 768px) {
  .header {
    .logo {
      margin-left: auto;
      margin-right: auto;
      float: initial;
      display: block;
    }
  }
}
</style>
