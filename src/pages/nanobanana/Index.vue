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
import Layout from '@/layouts/Nanobanana.vue';
import ConfigPanel from '@/components/nanobanana/ConfigPanel.vue';
import { nanobananaOperator } from '@/operators';
import { INanobananaGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP, NANOBANANA_DEFAULT_RESOLUTION, NANOBANANA_MODEL_NANO_BANANA_PRO } from '@/constants';
import RecentPanel from '@/components/nanobanana/RecentPanel.vue';
import { INanobananaTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/nanobanana';

interface IData {
  task: INanobananaTask | undefined;
  job: number;
  loading: boolean;
}

export default defineComponent({
  name: 'NanobananaIndex',
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
      return this.$store.state.nanobanana?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.nanobanana?.status?.getTasks === Status.Request;
    },
    credential() {
      return this.$store.state.nanobanana?.credential;
    },
    config() {
      return this.$store.state.nanobanana?.config;
    },
    application() {
      return this.$store.state.nanobanana?.application;
    },
    tasks() {
      return this.$store.state.nanobanana?.tasks;
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
      await this.$store.dispatch('nanobanana/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('nanobanana/getApplications');
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
      await this.$store.dispatch('nanobanana/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
    },
    async onGenerate() {
      const cfg: any = { ...(this.config || {}) };
      const hasReferenceImages = Array.isArray(cfg?.image_urls) && cfg.image_urls.length > 0;
      delete cfg.action;
      // If creating new images, omit reference images from payload
      if (!hasReferenceImages && 'image_urls' in cfg) {
        delete cfg.image_urls;
      }
      if (!cfg?.aspect_ratio) {
        delete cfg.aspect_ratio;
      }
      if (cfg?.model !== NANOBANANA_MODEL_NANO_BANANA_PRO && 'resolution' in cfg) {
        delete cfg.resolution;
      }
      if (cfg?.model === NANOBANANA_MODEL_NANO_BANANA_PRO && !cfg?.resolution) {
        cfg.resolution = NANOBANANA_DEFAULT_RESOLUTION;
      }
      const request = {
        ...cfg,
        action: hasReferenceImages ? 'edit' : 'generate',
        callback_url: CALLBACK_URL
      } as INanobananaGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('nanobanana.message.startingTask'));
      nanobananaOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('nanobanana.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('nanobanana.message.usedUp'));
          } else {
            ElMessage.error(this.$t('nanobanana.message.startTaskFailed') + (response?.error?.message || ''));
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
