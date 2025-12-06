<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <recent-panel ref="recentPanel" class="panel recent" :loading="loadingMore" @reach-top="onReachTop" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Pika.vue';
import ConfigPanel from '@/components/pika/ConfigPanel.vue';
import { applicationOperator, pikaOperator } from '@/operators';
import { IApplicationDetailResponse, IPikaGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/pika/RecentPanel.vue';
import { IPikaTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';

const CALLBACK_URL = 'https://webhook.acedata.cloud/pika';

interface IData {
  task: IPikaTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'PikaIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel
  },
  inject: ['initialized'],
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
      return this.$store.state.pika?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.pika?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    service() {
      return this.$store.state.pika.service;
    },
    credential() {
      return this.$store.state.pika.credential;
    },
    config() {
      return this.$store.state.pika.config;
    },
    initializing() {
      return this.$store.state.pika.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.pika.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.pika.application;
    },
    applications() {
      return this.$store.state.pika.applications;
    },
    tasks() {
      return this.$store.state.pika.tasks;
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
      await this.$store.dispatch('pika/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('pika/getApplications');
      console.debug('end onGetApplication');
      await this.onGetTasks();
    },
    onApply() {
      applicationOperator
        .create({
          // @ts-ignore
          application: this.application
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          ElMessage.success(this.$t('application.message.applySuccessfully'));
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
        });
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
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 5, createdAtMin, createdAtMax } = payload || {};
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      this.fetchingTasks = true;
      try {
        await this.$store.dispatch('pika/getTasks', {
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
      } as IPikaGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('pika.message.startingTask'));
      pikaOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('pika.message.startTaskSuccess'));
          this.$store.commit('pika/setConfig', {
            config: undefined
          });
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('pika.message.usedUp'));
          } else {
            ElMessage.error(this.$t('pika.message.startTaskFailed'));
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

<style lang="scss" scoped>
.status {
  margin-bottom: 10px;
}

.panel {
  &.detail {
    width: 100%;
    flex: 1;
    overflow-y: scroll;
  }
  &.recent {
    height: 100%;
    width: 100%;
    margin-bottom: 10px;
    position: relative;
    justify-content: initial;
  }
  &.operation {
    position: relative;
  }
}
</style>
