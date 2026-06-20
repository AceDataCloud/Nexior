<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <recent-panel ref="recentPanel" :loading="loadingMore" @reach-top="onReachTop" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Maestro.vue';
import ConfigPanel from '@/components/maestro/ConfigPanel.vue';
import RecentPanel from '@/components/maestro/RecentPanel.vue';
import { maestroOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IMaestroGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import { loadPreviousPage } from '@/utils/pagination';

interface IData {
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'MaestroIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel
  },
  inject: ['initialized'],
  data(): IData {
    return {
      job: 0,
      loadingMore: false,
      fetchingTasks: false
    };
  },
  computed: {
    applicationsLoading() {
      return this.$store.state.maestro?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.maestro?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.maestro.credential;
    },
    config() {
      return this.$store.state.maestro.config;
    },
    tasks() {
      return this.$store.state.maestro.tasks;
    }
  },
  watch: {
    initialized: {
      async handler(newValue) {
        if (newValue) {
          await this.onGetTasks();
          await this.onScrollDown();
          this.job = window.setInterval(() => {
            this.onGetTasks();
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
    async onReachTop() {
      await loadPreviousPage({
        tasks: this.tasks,
        getTasks: () => this.tasks,
        loading: this.loadingMore,
        setLoading: (v) => (this.loadingMore = v),
        isBlocked: () => this.tasksLoading || this.applicationsLoading,
        fetch: (createdAtMax) => this.onGetTasks({ createdAtMax }),
        getScrollElement: () => this.getTasksScrollElement()
      });
    },
    async onGetService() {
      await this.$store.dispatch('maestro/getService');
    },
    async onScrollDown() {
      await this.$nextTick();
      const el = this.getTasksScrollElement();
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number }) {
      if (this.applicationsLoading || this.fetchingTasks) {
        return;
      }
      const { limit = 5, createdAtMin, createdAtMax } = payload || {};
      this.fetchingTasks = true;
      try {
        await this.$store.dispatch('maestro/getTasks', { limit, createdAtMin, createdAtMax });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerate() {
      const request = {
        ...this.config,
        async: true
      } as IMaestroGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('maestro.message.startingTask'));
      instrumentGeneration('maestro', maestroOperator.generate(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('maestro.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('maestro.message.usedUp'));
          } else {
            ElMessage.error(this.$t('maestro.message.startTaskFailed'));
          }
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
