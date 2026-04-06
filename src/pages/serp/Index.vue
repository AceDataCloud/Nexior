<template>
  <layout>
    <template #config>
      <search-panel @search="onSearch" />
    </template>
    <template #result>
      <result-panel @related-search="onRelatedSearch" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Serp.vue';
import SearchPanel from '@/components/serp/SearchPanel.vue';
import ResultPanel from '@/components/serp/ResultPanel.vue';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';

export default defineComponent({
  name: 'SerpIndex',
  components: {
    Layout,
    SearchPanel,
    ResultPanel
  },
  inject: ['initialized'],
  async mounted() {
    await this.onGetService();
  },
  methods: {
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('serp/getService');
      console.debug('end onGetService');
    },
    async onSearch() {
      const config = this.$store.state.serp?.config;
      if (!config?.query) {
        return;
      }
      ElMessage.info(this.$t('serp.message.searching'));
      try {
        await this.$store.dispatch('serp/search');
        ElMessage.success(this.$t('serp.message.searchSuccess'));
      } catch (error: any) {
        const response = error?.response?.data;
        if (response?.error?.code === ERROR_CODE_USED_UP) {
          ElMessage.error(this.$t('serp.message.usedUp'));
        } else {
          ElMessage.error(this.$t('serp.message.searchFailed'));
        }
      }
    },
    async onRelatedSearch(query: string) {
      this.$store.commit('serp/setConfig', {
        ...this.$store.state.serp?.config,
        query
      });
      await this.onSearch();
    }
  }
});
</script>
