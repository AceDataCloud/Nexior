<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { authOperator } from './operators/auth/operator';

export default defineComponent({
  components: {
    ElConfigProvider
  },
  data() {
    return {
      locale: zhCn
    };
  },
  async mounted() {
    // if refresh token is already set, try to refresh it and get user info
    const currentRefreshToken = this.$store.getters.refreshToken;
    const currentAccessToken = this.$store.getters.accessToken;
    if (!currentAccessToken) {
      console.log('user not login');
    }
    if (currentRefreshToken) {
      const {
        data: { access: accessToken, refresh: refreshToken }
      } = await authOperator.refreshToken({
        refresh: currentRefreshToken
      });
      await this.$store.dispatch('setAccessToken', accessToken);
      await this.$store.dispatch('setRefreshToken', refreshToken);
      await this.$store.dispatch('getMe');
    } else {
      console.error('refresh token does not exist');
    }
  }
});
</script>
