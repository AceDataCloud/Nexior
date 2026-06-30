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
import ConfigPanel from '@/components/seedance/ConfigPanel.vue';
import RecentPanel from '@/components/seedance/RecentPanel.vue';
import { seedanceOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { ISeedanceGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP, getSeedanceCapability, SEEDANCE_MODEL_CAPABILITIES } from '@/constants';
import { ISeedanceTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';

interface IData {
  task: ISeedanceTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'SeedanceIndex',
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
      return this.$store.state.seedance?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.seedance?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.seedance?.credential;
    },
    config() {
      return this.$store.state.seedance?.config;
    },
    tasks() {
      return this.$store.state.seedance?.tasks;
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
      await this.$store.dispatch('seedance/getService');
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
        await this.$store.dispatch('seedance/getTasks', {
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

      if (Array.isArray(cfg?.images)) {
        cfg.images = cfg.images.filter((img: any) => !!img?.url);
        const hasFirstFrame = cfg.images.some((img: any) => img?.role === 'first_frame');
        const hasLastFrame = cfg.images.some((img: any) => img?.role === 'last_frame');
        if (!hasFirstFrame && hasLastFrame) {
          cfg.images = cfg.images.map((img: any) =>
            img?.role === 'last_frame' ? { ...img, role: 'first_frame' } : img
          );
        }
      }

      const hasImages = Array.isArray(cfg?.images) && cfg.images.length > 0;
      if (!hasImages && 'images' in cfg) {
        delete cfg.images;
      }

      // Validate against the per-model capability matrix BEFORE submitting so users
      // get an inline warning instead of an opaque "model X is not supported" error.
      if (cfg?.model && !SEEDANCE_MODEL_CAPABILITIES[cfg.model]) {
        ElMessage.warning(this.$t('seedance.message.modelUnsupported'));
        return;
      }
      const cap = getSeedanceCapability(cfg?.model);
      if (cap.requiresImage && !hasImages) {
        ElMessage.warning(this.$t('seedance.message.modelRequiresImage'));
        return;
      }
      if (!cap.acceptsImage && hasImages) {
        ElMessage.warning(this.$t('seedance.message.modelRejectsImage'));
        return;
      }
      if (!cap.acceptsText && !hasImages) {
        ElMessage.warning(this.$t('seedance.message.modelRequiresImage'));
        return;
      }
      if (!cap.acceptsAudio && cfg.generate_audio) {
        cfg.generate_audio = false;
      }
      if (!cap.acceptsReturnLastFrame && cfg.return_last_frame) {
        cfg.return_last_frame = false;
      }
      if (!cap.acceptsLastFrame && hasImages) {
        cfg.images = cfg.images.filter((img: any) => img?.role !== 'last_frame');
      }

      // Reference media (Seedance 2.0 multimodal): keep only valid urls, drop
      // entirely when the model doesn't accept that reference type.
      if (cap.acceptsReferenceAudio && Array.isArray(cfg?.audios)) {
        cfg.audios = cfg.audios.filter((a: any) => a?.url);
      }
      if (!cap.acceptsReferenceAudio || !Array.isArray(cfg?.audios) || cfg.audios.length === 0) {
        delete cfg.audios;
      }
      if (cap.acceptsReferenceVideo && Array.isArray(cfg?.videos)) {
        cfg.videos = cfg.videos.filter((v: any) => v?.url);
      }
      if (!cap.acceptsReferenceVideo || !Array.isArray(cfg?.videos) || cfg.videos.length === 0) {
        delete cfg.videos;
      }
      if (!cap.acceptsReferenceImage && Array.isArray(cfg?.images)) {
        cfg.images = cfg.images.filter((img: any) => img?.role !== 'reference_image');
        if (cfg.images.length === 0) delete cfg.images;
      }

      // Reference audio needs a paired reference image (the talking-head subject);
      // upstream rejects an audio-only reference, so warn inline instead.
      const hasReferenceImage =
        Array.isArray(cfg?.images) && cfg.images.some((img: any) => img?.role === 'reference_image');
      if (Array.isArray(cfg?.audios) && cfg.audios.length > 0 && !hasReferenceImage) {
        ElMessage.warning(this.$t('seedance.message.audioRequiresReferenceImage'));
        return;
      }

      const request = {
        ...cfg,
        async: true
      } as ISeedanceGenerateRequest;

      if (!ensureLoggedIn()) {
        return;
      }
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('seedance.message.startingTask'));
      instrumentGeneration('seedance', seedanceOperator.generate(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('seedance.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('seedance.message.usedUp'));
          } else {
            ElMessage.error(this.$t('seedance.message.startTaskFailed') + (response?.error?.message || ''));
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
