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
import Layout from '@/layouts/DigitalHuman.vue';
import ConfigPanel from '@/components/digitalhuman/ConfigPanel.vue';
import RecentPanel from '@/components/digitalhuman/RecentPanel.vue';
import { digitalHumanOperator } from '@/operators';
import { ensureLoggedIn } from '@/utils';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IDigitalHumanGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import { loadPreviousPage } from '@/utils/pagination';

interface IData {
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'DigitalHumanIndex',
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
      return this.$store.state.digitalhuman?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.digitalhuman?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.digitalhuman.credential;
    },
    config() {
      return this.$store.state.digitalhuman.config;
    },
    tasks() {
      return this.$store.state.digitalhuman.tasks;
    }
  },
  watch: {
    initialized: {
      async handler(newValue) {
        window.clearInterval(this.job);
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
      await this.$store.dispatch('digitalhuman/getService');
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
        await this.$store.dispatch('digitalhuman/getTasks', { limit, createdAtMin, createdAtMax });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerate(request: IDigitalHumanGenerateRequest) {
      if (!ensureLoggedIn()) {
        return;
      }
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('digitalhuman.message.startingTask'));
      instrumentGeneration('digitalhuman', digitalHumanOperator.generate(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('digitalhuman.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('digitalhuman.message.usedUp'));
          } else {
            ElMessage.error(this.$t('digitalhuman.message.startTaskFailed'));
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
