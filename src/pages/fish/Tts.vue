<template>
  <layout>
    <template #config>
      <div class="flex flex-col h-full">
        <tab-switcher />
        <div class="flex-1 min-h-0">
          <config-panel @generate="onGenerate" />
        </div>
      </div>
    </template>
    <template #result>
      <recent-panel ref="recentPanel" :loading="loadingMore" @reach-top="onReachTop" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Hailuo.vue';
import ConfigPanel from '@/components/fish/ConfigPanel.vue';
import RecentPanel from '@/components/fish/RecentPanel.vue';
import TabSwitcher from '@/components/fish/TabSwitcher.vue';
import { fishOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IFishTask, IFishTtsRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP, FISH_DEFAULT_TTS_MODEL, getWebhookCallbackUrl } from '@/constants';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload } from '@/utils';

const CALLBACK_URL = getWebhookCallbackUrl('fish');

interface IData {
  task: IFishTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'FishTtsIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel,
    TabSwitcher
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
      return this.$store.state.fish?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.fish?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.fish?.credential;
    },
    config() {
      return this.$store.state.fish?.config;
    },
    application() {
      return this.$store.state.fish?.application;
    },
    tasks() {
      return this.$store.state.fish?.tasks;
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
    // Pre-fetch the user's voice clones so the VoicePicker dropdown has
    // entries on first paint — without this, users had to navigate to
    // /fish/model first to populate state.fish.voices, and the dropdown
    // would otherwise sit on 'No voice models yet' even when the user
    // already had voices in the backend.
    await this.$store.dispatch('fish/getVoices');
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
        fetch: (createdAtMax) =>
          this.onGetTasks({
            createdAtMax
          }),
        getScrollElement: () => this.getTasksScrollElement()
      });
    },
    async onGetService() {
      await this.$store.dispatch('fish/getService');
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
        await this.$store.dispatch('fish/getTasks', {
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
      const cfg = this.config ?? {};
      const text = cfg.text?.trim();
      if (!text) {
        ElMessage.warning(this.$t('fish.message.textRequired'));
        return;
      }
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      const headerModel = (cfg.model || FISH_DEFAULT_TTS_MODEL) as string;
      const request: IFishTtsRequest = {
        text,
        callback_url: CALLBACK_URL
      };
      if (cfg.reference_id) {
        request.reference_id = cfg.reference_id;
      }
      if (cfg.format) {
        request.format = cfg.format;
      }
      if (cfg.prosody && Object.keys(cfg.prosody).length > 0) {
        request.prosody = cfg.prosody;
      }
      ElMessage.info(this.$t('fish.message.startingTask'));
      instrumentGeneration('fish', fishOperator.generateTts(request, { token, model: headerModel }))
        .then(() => {
          ElMessage.success(this.$t('fish.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('fish.message.usedUp'));
          } else {
            ElMessage.error(this.$t('fish.message.startTaskFailed'));
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
