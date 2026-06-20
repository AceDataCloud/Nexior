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
import Layout from '@/layouts/Seedance.vue';
import ConfigPanel from '@/components/grokvideo/ConfigPanel.vue';
import RecentPanel from '@/components/grokvideo/RecentPanel.vue';
import { grokvideoOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IGrokVideoGenerateRequest, IGrokVideoTask, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP, isGrokVideoImageOnlyModel } from '@/constants';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload } from '@/utils';

interface IData {
  task: IGrokVideoTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'GrokVideoIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel
  },
  mixins: [uploadTrackerProviderMixin],
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
      return this.$store.state.grokvideo?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.grokvideo?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.grokvideo?.credential;
    },
    config() {
      return this.$store.state.grokvideo?.config;
    },
    tasks() {
      return this.$store.state.grokvideo?.tasks;
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
      await this.$store.dispatch('grokvideo/getService');
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
        await this.$store.dispatch('grokvideo/getTasks', {
          limit,
          createdAtMin,
          createdAtMax
        });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerate() {
      if (
        !ensureNoPendingUpload(
          this.uploadTracker,
          (k) => this.$t(k) as string,
          (m) => ElMessage.warning(m)
        )
      ) {
        return;
      }
      const cfg: any = { ...(this.config || {}) };
      if (typeof cfg?.prompt === 'string') {
        cfg.prompt = cfg.prompt.trim();
        if (!cfg.prompt) delete cfg.prompt;
      }
      if (typeof cfg?.image_url === 'string' && !cfg.image_url.trim()) {
        delete cfg.image_url;
      }

      const hasImage = !!cfg?.image_url;
      // grok-imagine-video-1.5-preview is image-to-video only.
      if (isGrokVideoImageOnlyModel(cfg?.model) && !hasImage) {
        ElMessage.warning(this.$t('grokvideo.message.modelRequiresImage'));
        return;
      }
      // Text-to-video needs a prompt when no image is provided.
      if (!hasImage && !cfg?.prompt) {
        ElMessage.warning(this.$t('grokvideo.message.promptOrImageRequired'));
        return;
      }

      const request = {
        ...cfg,
        async: true
      } as IGrokVideoGenerateRequest;

      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('grokvideo.message.startingTask'));
      instrumentGeneration('grokvideo', grokvideoOperator.generate(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('grokvideo.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('grokvideo.message.usedUp'));
          } else {
            ElMessage.error(this.$t('grokvideo.message.startTaskFailed') + (response?.error?.message || ''));
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
