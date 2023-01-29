<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { registerIcons } from './plugins/font-awesome';

export default defineComponent({
  components: {
    ElConfigProvider
  },
  data() {
    return {
      locale: zhCn
    };
  },
  mounted() {
    // if access token is already set, try to get user info
    const accessToken = this.$store.getters.accessToken;
    if (accessToken) {
      this.$store.dispatch('getMe');
    }
  }
});
</script>
