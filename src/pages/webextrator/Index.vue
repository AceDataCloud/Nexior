<template>
  <layout>
    <template #config>
      <config-panel @run="onRun" />
    </template>
    <template #result>
      <result-panel />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Webextrator.vue';
import ConfigPanel from '@/components/webextrator/ConfigPanel.vue';
import ResultPanel from '@/components/webextrator/ResultPanel.vue';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import { ensureLoggedIn } from '@/utils';

export default defineComponent({
  name: 'WebextratorIndex',
  components: {
    Layout,
    ConfigPanel,
    ResultPanel
  },
  inject: ['initialized'],
  async mounted() {
    await this.$store.dispatch('webextrator/getService');
  },
  methods: {
    async onRun() {
      // Deferred auth: guests compose freely; running the extraction triggers login.
      if (!ensureLoggedIn()) {
        return;
      }
      const config = this.$store.state.webextrator?.config;
      if (!config?.url) return;
      const isExtract = (config.mode || 'extract') === 'extract';
      ElMessage.info(this.$t(isExtract ? 'webextrator.message.extracting' : 'webextrator.message.rendering'));
      try {
        await this.$store.dispatch('webextrator/run');
        ElMessage.success(this.$t('webextrator.message.success'));
      } catch (error: any) {
        const code = error?.response?.data?.error?.code || error?.response?.data?.code;
        if (code === ERROR_CODE_USED_UP) {
          ElMessage.error(this.$t('webextrator.message.usedUp'));
        } else if (code === 'too_many_requests') {
          ElMessage.error(this.$t('webextrator.message.busy'));
        } else if (code === 'timeout') {
          ElMessage.error(this.$t('webextrator.message.timeout'));
        } else if (code === 'antibot_blocked') {
          // The target served an anti-bot challenge we couldn't clear. The API
          // returns 422 for these, so the request is NOT billed — say so.
          ElMessage.error(this.$t('webextrator.message.antibotBlocked'));
        } else {
          ElMessage.error(this.$t('webextrator.message.failed'));
        }
      }
    }
  }
});
</script>
