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
import { getDomain, getPath, setCookie } from './utils';
import AuthPanel from './components/common/AuthPanel.vue';

export default defineComponent({
  components: {
    ElConfigProvider,
    AuthPanel
  },
  data() {
    return {
      locale: zhCn,
      inviterId: this.$route.query.inviter_id?.toString()
    };
  },
  methods: {
    onSetCookie() {
      // set inviter to cookies to persist
      if (this.inviterId) {
        // current date + 7 days
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 7);
        setCookie('INVITER_ID', this.inviterId, {
          domain: getDomain(),
          path: getPath(),
          expires: expiration
        });
      }
    }
  }
});
</script>
