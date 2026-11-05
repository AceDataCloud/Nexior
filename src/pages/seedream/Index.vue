<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <showcase-result-tabs service="seedream">
        <template #task-actions>
          <task-history-toolbar
            :date="historyDate"
            :busy="historyBusy"
            :has-more="historyHasMore"
            :error="historyError"
            @date-change="onHistoryDateChange"
            @load-more="onReachTop"
          />
        </template>
        <template #tasks>
          <recent-panel ref="recentPanel" :loading="loading" @reach-top="onReachTop" />
        </template>
      </showcase-result-tabs>
    </template>
  </layout>
</template>

<script lang="ts">
import { showQuotaExhausted } from '@/utils/quotaExhausted';
import { defineComponent } from 'vue';
import Layout from '@/layouts/Seedream.vue';
import ConfigPanel from '@/components/seedream/ConfigPanel.vue';
import { seedreamOperator } from '@/operators';
import { buildSeedreamRequest } from '@/utils/seedream/request';
import { getSeedreamCapabilities } from '@/utils/seedream/capabilities';
import { instrumentGeneration } from '@/plugins/telemetry';
import { ISeedreamGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';

import RecentPanel from '@/components/seedream/RecentPanel.vue';
import ShowcaseResultTabs from '@/components/common/ShowcaseResultTabs.vue';
import { taskHistoryMixin } from '@/utils/taskHistoryMixin';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';
import { ISeedreamTask } from '@/models';
import { showcaseRecreateMixin } from '@/utils/showcaseRecreateMixin';
import { getGenerationInputError } from '@/utils/generationInput';
import { taskPollingMixin } from '@/utils/taskPollingMixin';

interface IData {
  task: ISeedreamTask | undefined;
  job: number;
  loading: boolean;
}

export default defineComponent({
  name: 'SeedreamIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel,
    ShowcaseResultTabs
  },
  mixins: [
    taskHistoryMixin('seedream'),
    uploadTrackerProviderMixin,
    showcaseRecreateMixin('seedream'),
    taskPollingMixin('seedream')
  ],
  inject: ['initialized'],
  data(): IData {
    return {
      task: undefined,
      job: 0,
      loading: false
    };
  },
  computed: {
    applicationsLoading() {
      return this.$store.state.seedream?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.seedream?.status?.getTasks === Status.Request;
    },
    credential() {
      return this.$store.state.seedream?.credential;
    },
    config() {
      return this.$store.state.seedream?.config;
    },
    application() {
      return this.$store.state.seedream?.application;
    },
    tasks() {
      return this.$store.state.seedream?.tasks;
    }
  },
  watch: {
    tasks: {
      handler(value, oldValue) {
        if (value?.items?.length > oldValue?.items?.length) {
          console.debug('new tasks detected');
        }
      },
      deep: true
    },
    initialized: {
      async handler(newValue) {
        if (newValue) {
          console.debug('layout initialized');
          await this.onGetTasks({ replace: true });
          await this.onScrollDown();
          this.job = window.setInterval(() => {
            void this.onPollTasks();
          }, 5000);
        }
      },
      immediate: true
    }
  },
  async mounted() {
    await this.onGetService();
  },
  async unmounted() {
    window.clearInterval(this.job);
  },
  methods: {
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('seedream/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('seedream/getApplications');
      console.debug('end onGetApplication');
      await this.onGetTasks();
    },
    async onScrollDown() {
      await this.$nextTick();
      const el = this.getTasksScrollElement();
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number; replace?: boolean }) {
      if (this.applicationsLoading || this.tasksLoading) {
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 20, createdAtMin, createdAtMax, replace } = this.historyQuery(payload);
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      return await this.$store.dispatch('seedream/getTasks', {
        limit,
        createdAtMin,
        createdAtMax,
        replace
      });
    },
    async onGenerate() {
      const request = buildSeedreamRequest(this.config) as ISeedreamGenerateRequest;
      const inputError = getGenerationInputError('seedream', request);
      if (inputError) {
        ElMessage.error(this.$t(`common.message.${inputError}`));
        return;
      }
      if (
        !ensureNoPendingUpload(
          this.uploadTracker,
          (k) => this.$t(k) as string,
          (m) => ElMessage.warning(m)
        )
      ) {
        return;
      }
      if (getSeedreamCapabilities(this.config?.model).imageRequired && !this.config?.image?.length) {
        ElMessage.warning(this.$t('seedream.message.referenceImageRequired'));
        return;
      }
      if (!ensureLoggedIn()) {
        return;
      }
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('seedream.message.startingTask'));
      instrumentGeneration('seedream', seedreamOperator.generate(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('seedream.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (showQuotaExhausted(error, 'seedream')) return;
          ElMessage.error(this.$t('seedream.message.startTaskFailed') + (response?.error?.message || ''));
        })
        .finally(async () => {
          setTimeout(async () => {
            await this.onGetTasks();
            await this.onScrollDown();
          }, 1000);
        });
    },
    getTasksScrollElement(): HTMLElement | undefined {
      const panel = this.$refs.recentPanel as any;
      return panel?.getScrollElement?.();
    }
  }
});
</script>
