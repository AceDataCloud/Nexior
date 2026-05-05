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
import Layout from '@/layouts/OpenAIImage.vue';
import ConfigPanel from '@/components/openaiimage/ConfigPanel.vue';
import { openaiimageOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IOpenAIImageEditRequest, IOpenAIImageGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/openaiimage/RecentPanel.vue';
import { loadPreviousPage } from '@/utils/pagination';
import { IOpenAIImageTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/openaiimage';

interface IData {
  task: IOpenAIImageTask | undefined;
  job: number;
  loading: boolean;
}

export default defineComponent({
  name: 'OpenAIImageIndex',
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
      return this.$store.state.openaiimage?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.openaiimage?.status?.getTasks === Status.Request;
    },
    credential() {
      return this.$store.state.openaiimage?.credential;
    },
    config() {
      return this.$store.state.openaiimage?.config;
    },
    application() {
      return this.$store.state.openaiimage?.application;
    },
    tasks() {
      return this.$store.state.openaiimage?.tasks;
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
      await loadPreviousPage({
        tasks: this.tasks,
        getTasks: () => this.tasks,
        loading: this.loading,
        setLoading: (v) => (this.loading = v),
        isBlocked: () => this.tasksLoading,
        fetch: (createdAtMax) => this.onGetTasks({ createdAtMax }),
        getScrollElement: () => this.getTasksScrollElement(),
        preserveScroll: false
      });
    },
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('openaiimage/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('openaiimage/getApplications');
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
      await this.$store.dispatch('openaiimage/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
    },
    async onGenerate() {
      const cfg: any = { ...(this.config || {}) };
      const hasReferenceImages = Array.isArray(cfg?.image_urls) && cfg.image_urls.length > 0;

      if (!hasReferenceImages && 'image_urls' in cfg) {
        delete cfg.image_urls;
      }

      const generateRequest = {
        ...cfg,
        action: 'generate',
        callback_url: CALLBACK_URL
      } as IOpenAIImageGenerateRequest;

      const editRequest = {
        action: 'edit',
        model: cfg?.model,
        prompt: cfg?.prompt,
        image_urls: cfg?.image_urls || [],
        callback_url: CALLBACK_URL
      } as IOpenAIImageEditRequest;

      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }

      ElMessage.info(this.$t('openaiimage.message.startingTask'));

      const request = instrumentGeneration(
        'openaiimage',
        hasReferenceImages
          ? openaiimageOperator.edit(editRequest, {
              token
            })
          : openaiimageOperator.generate(generateRequest, {
              token
            })
      );

      request
        .then((response) => {
          console.debug('task accepted', response.data?.task_id);
          ElMessage.success(this.$t('openaiimage.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('openaiimage.message.usedUp'));
          } else {
            ElMessage.error(this.$t('openaiimage.message.startTaskFailed') + (response?.error?.message || ''));
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
