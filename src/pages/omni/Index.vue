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
import Layout from '@/layouts/Omni.vue';
import ConfigPanel from '@/components/omni/ConfigPanel.vue';
import RecentPanel from '@/components/omni/RecentPanel.vue';
import { omniOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IOmniGenerateRequest, IOmniTask, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';

interface IData {
  task: IOmniTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'OmniIndex',
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
      return this.$store.state.omni?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.omni?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.omni?.credential;
    },
    config() {
      return this.$store.state.omni?.config;
    },
    tasks() {
      return this.$store.state.omni?.tasks;
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
      await this.$store.dispatch('omni/getService');
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
        await this.$store.dispatch('omni/getTasks', {
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
      // Normalize reference images / video: drop blank entries and empty arrays.
      if (Array.isArray(cfg?.image_urls)) {
        cfg.image_urls = cfg.image_urls.filter((u: string) => typeof u === 'string' && u.trim());
        if (!cfg.image_urls.length) delete cfg.image_urls;
      }
      if (Array.isArray(cfg?.video_urls)) {
        cfg.video_urls = cfg.video_urls.filter((u: string) => typeof u === 'string' && u.trim());
        if (!cfg.video_urls.length) delete cfg.video_urls;
      }

      // Prompt is always required by /gemini/videos.
      if (!cfg?.prompt) {
        ElMessage.warning(this.$t('omni.message.promptRequired'));
        return;
      }
      // Video editing (video_urls) requires at least one reference image upstream.
      if (cfg?.video_urls && !cfg?.image_urls) {
        ElMessage.warning(this.$t('omni.message.videoRequiresImage'));
        return;
      }

      const request = {
        ...cfg,
        async: true
      } as IOmniGenerateRequest;

      if (!ensureLoggedIn()) {
        return;
      }
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('omni.message.startingTask'));
      instrumentGeneration('omni', omniOperator.generate(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('omni.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('omni.message.usedUp'));
          } else {
            ElMessage.error(this.$t('omni.message.startTaskFailed') + (response?.error?.message || ''));
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
