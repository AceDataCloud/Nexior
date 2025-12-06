<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <recent-panel ref="recentPanel" :loading="loadingMore" @reach-top="onReachTop" @extend="$emit('extend')" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Luma.vue';
import ConfigPanel from '@/components/luma/ConfigPanel.vue';
import { lumaOperator } from '@/operators';
import { ILumaGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/luma/RecentPanel.vue';
import { ILumaTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';

const CALLBACK_URL = 'https://webhook.acedata.cloud/luma';

interface IData {
  task: ILumaTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'LumaIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel
  },
  inject: ['initialized'],
  emits: ['extend'],
  data(): IData {
    return {
      task: undefined,
      job: 0,
      loadingMore: false,
      fetchingTasks: false
    };
  },
  computed: {
    applicationsLoading() {
      return this.$store.state.luma?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.luma?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.luma.credential;
    },
    config() {
      return this.$store.state.luma.config;
    },
    application() {
      return this.$store.state.luma.application;
    },
    tasks() {
      return this.$store.state.luma.tasks;
    }
  },
  watch: {
    tasks: {
      handler(value, oldValue) {
        // scroll down if new tasks are added
        if (value?.items?.length > oldValue?.items?.length) {
          console.debug('new tasks detected');
          // this.onScrollDown();
        }
      },
      deep: true
    },
    initialized: {
      async handler(newValue) {
        if (newValue) {
          console.debug('layout initialized');
          await this.onGetTasks();
          await this.onScrollDown();
          this.job = setInterval(() => {
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
    clearInterval(this.job);
  },
  methods: {
    async onReachTop() {
      await loadPreviousPage({
        tasks: this.tasks,
        getTasks: () => this.tasks,
        loading: this.loadingMore,
        setLoading: (v) => (this.loadingMore = v),
        isBlocked: () => this.tasksLoading || this.applicationsLoading,
        fetch: (createdAtMax) =>
          this.onGetTasks({
            createdAtMax
          }),
        getScrollElement: () => this.getTasksScrollElement()
      });
    },
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('luma/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('luma/getApplications');
      console.debug('end onGetApplication');
      await this.onGetTasks();
    },
    async onScrollDown() {
      console.debug('scrolling down');
      await this.$nextTick();
      const el = this.getTasksScrollElement();
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number }) {
      if (this.applicationsLoading || this.fetchingTasks) {
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 5, createdAtMin, createdAtMax } = payload || {};
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      this.fetchingTasks = true;
      try {
        await this.$store.dispatch('luma/getTasks', {
          limit,
          createdAtMin,
          createdAtMax
        });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerate() {
      const request = {
        ...this.config,
        callback_url: CALLBACK_URL
      } as ILumaGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('luma.message.startingTask'));
      lumaOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('luma.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('luma.message.usedUp'));
          } else {
            ElMessage.error(this.$t('luma.message.startTaskFailed'));
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
