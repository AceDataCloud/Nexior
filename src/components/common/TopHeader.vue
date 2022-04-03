<template>
  <el-container id="header" class="header">
    <el-aside width="250px">
      <img src="@/assets/images/logo.svg" class="logo" @click="onHome" />
    </el-aside>
    <el-main>
      <el-row>
        <el-col :span="20">
          <el-menu :default-active="active" class="el-menu-demo" mode="horizontal" @select="onSelect">
            <el-menu-item index="/courses" v-t="'common.nav.course'"></el-menu-item>
          </el-menu>
        </el-col>
        <el-col :span="4">
          <div class="mt-4 pr-10" v-if="!$store.getters.authenticated">
            <el-button type="primary" class="float-right" size="small" round @click="onLogin">{{
              $t('common.button.login')
            }}</el-button>
          </div>
          <div class="mt-3 pr-10 float-right" v-else>
            <el-dropdown trigger="click">
              <img :src="$store.getters.user?.avatar" class="avatar" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="onLogout">{{ $t('common.button.logout') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TopHeader',
  data() {
    return {};
  },
  computed: {
    active() {
      return this.$route.matched[0].path;
    }
  },
  methods: {
    onSelect(val: string) {
      this.$router.push(val);
    },
    onHome() {
      this.$router.push({
        name: 'home'
      });
    },
    onLogin() {
      this.$router.push({
        name: 'login'
      });
    },
    onLogout() {
      this.$store.dispatch('resetAuth');
      this.$router.push('/');
    }
  }
});
</script>

<style lang="scss">
$height: 60px;
.header {
  height: $height;
  z-index: 999;
  width: 100%;
  background: radial-gradient(circle at 0 2%, #283e63, #172337 99%);
  .logo {
    height: $height - 5px;
    width: 250px;
    cursor: pointer;
  }
  .el-main {
    padding: 0;
    .el-menu {
      --el-menu-hover-bg-color: rgba(255, 255, 255, 0);
      --el-menu-active-color: white;
      background: none;
      border: none;
      .el-menu-item {
        height: $height;
        color: white;
        &.is-active {
          border-bottom: 3px solid var(--el-menu-active-color);
        }
        &:hover {
          border-bottom: 3px solid var(--el-color-primary);
        }
      }
    }
  }
  .avatar {
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
  }
}
</style>
