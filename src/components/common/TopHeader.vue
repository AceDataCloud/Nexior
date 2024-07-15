<template>
  <el-row class="header">
    <el-col :md="4" :xs="24">
      <logo @click="onHome" />
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import defaultAvatar from '@/assets/images/avatar.png';
import { getBaseUrlAuth } from '@/utils';
import { ROUTE_AUTH_LOGIN, ROUTE_CONSOLE_ROOT, ROUTE_INDEX } from '@/router';
import { ElCol, ElRow } from 'element-plus';
import Logo from './Logo.vue';

export default defineComponent({
  name: 'TopHeader',
  components: {
    ElCol,
    Logo,
    ElRow
  },
  data() {
    return {
      defaultAvatar
    };
  },
  computed: {
    dark() {
      return this.$store.getters.dark;
    },
    active() {
      return this.$route.matched[0].path;
    },
    user() {
      return this.$store.getters.user;
    },
    authenticated() {
      return this.$store.getters.authenticated;
    }
  },
  methods: {
    onSelect(val: string) {
      this.$router.push(val);
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
      await this.$store.dispatch('resetToken');
      await this.$store.dispatch('resetUser');
      const url = window.location.href;
      const baseUrlAuth = getBaseUrlAuth();
      const redirectUrl = `${baseUrlAuth}/auth/logout?redirect=${url}`;
      window.location.href = redirectUrl;
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

  .el-menu {
    --el-menu-hover-bg-color: var(--el-bg-color);
    --el-menu-active-color: var(--el-color-primary);
    background: none;
    border: none;
    height: $height;
    .el-menu-item {
      height: $height;
      color: inherit !important;
      &.is-active {
        color: inherit !important;
        border-bottom: 2px solid var(--el-color-primary);
      }
      &:hover {
        border-bottom: 2px solid var(--el-color-primary);
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
  }
}
@media only screen and (max-width: 768px) {
  .header {
    .logo {
      margin-left: auto;
      margin-right: auto;
      float: initial;
    }
  }
}
</style>
