<template>
  <el-config-provider :locale="locale">
    <router-view />
    <auth-panel />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import AuthPanel from './components/common/AuthPanel.vue';

export default defineComponent({
  components: {
    ElConfigProvider,
    AuthPanel
  },
  data() {
    return {
      locale: zhCn
    };
  }
});
</script>
