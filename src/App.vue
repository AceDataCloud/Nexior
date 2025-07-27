<template>
  <el-config-provider :locale="locale">
    <auth-panel v-if="authPopup" />
    <router-view />
    <el-tag v-if="isTest" size="large" class="tag" type="warning">{{ $t('index.button.testEnv') }}</el-tag>
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElConfigProvider, ElTag } from 'element-plus';
import AuthPanel from './components/common/AuthPanel.vue';
import locale from 'element-plus/es/locale/lang/en';
import { isTest } from '@/constants/endpoint';

export default defineComponent({
  components: {
    ElConfigProvider,
    AuthPanel,
    ElTag
  },
  data() {
    return {
      isTest,
      locale
    };
  },
  computed: {
    authPopup() {
      return this.$store.state.auth.flow === 'popup' && this.$store.state.auth.visible;
    }
  },
  mounted() {
    const authenticated = !!this.$store.state.token.access && !!this.$store.state.user?.id;
    console.debug('App mounted, authenticated:', authenticated);
    if (!authenticated) {
      this.$store.dispatch('logout');
      this.$store.dispatch('login');
    }
  }
});
</script>

<style lang="scss">
.tag {
  position: fixed;
  bottom: 10px;
  right: 10px;
  z-index: 10000;
}
</style>
