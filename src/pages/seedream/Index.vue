<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <recent-panel ref="recentPanel" :loading="loading" @reach-top="onReachTop" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Seedream.vue';
import ConfigPanel from '@/components/seedream/ConfigPanel.vue';
import { seedreamOperator } from '@/operators';
import { ISeedreamGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/seedream/RecentPanel.vue';
import { ISeedreamTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/seedream';

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
    RecentPanel
  },
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
      console.debug('reached top');
      if (this.loading || this.tasksLoading) {
        return;
      }
      const total = this.tasks?.total;
      const currentLength = this.tasks?.items?.length || 0;
      if (total !== undefined && total <= currentLength) {
        return;
      }
      const oldest = this.tasks?.items?.[0];
      if (!oldest?.created_at) {
        return;
      }
      const panel = this.$refs.recentPanel as any;
      const el = panel?.getScrollElement?.() as HTMLElement | undefined;
      const previousHeight = el?.scrollHeight || 0;
      const previousScrollTop = el?.scrollTop || 0;
      this.loading = true;
      try {
        await this.onGetTasks({
          createdAtMax: oldest.created_at
        });
        await this.$nextTick();
        if (el) {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - previousHeight + previousScrollTop;
        }
      } finally {
        this.loading = false;
      }
    },
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
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number }) {
      if (this.applicationsLoading || this.tasksLoading) {
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 20, createdAtMin, createdAtMax } = payload || {};
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      await this.$store.dispatch('seedream/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
    },
    async onGenerate() {
      const cfg: any = { ...(this.config || {}) };
      const hasReferenceImages = Array.isArray(cfg?.image) && cfg.image.length > 0;
      if (!hasReferenceImages && 'image' in cfg) {
        delete cfg.image;
      }
      if (!cfg?.size) {
        delete cfg.size;
      }
      const request = {
        ...cfg,
        callback_url: CALLBACK_URL
      } as ISeedreamGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('seedream.message.startingTask'));
      seedreamOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('seedream.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('seedream.message.usedUp'));
          } else {
            ElMessage.error(this.$t('seedream.message.startTaskFailed') + (response?.error?.message || ''));
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
