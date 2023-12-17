<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { applicationOperator, userOperator } from './operators';

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
    const { data: user } = await userOperator.getMe();
    this.$store.dispatch('setUser', user);
    const { data: applications } = await applicationOperator.getAll({
      user_id: user.id
    });
    this.$store.dispatch('setApplications', applications);
  }
});
</script>
