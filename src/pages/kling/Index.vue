<template>
  <layout>
    <template #config>
      <div class="flex flex-col h-full">
        <tab-switcher :model-value="taskType" @update:model-value="onTabChange" />
        <div class="flex-1 min-h-0">
          <config-panel v-if="taskType === 'videos'" @generate="onGenerate" />
          <motion-panel v-else-if="taskType === 'motion'" @generate="onGenerateMotion" />
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
import Layout from '@/layouts/Kling.vue';
import ConfigPanel from '@/components/kling/ConfigPanel.vue';
import MotionPanel from '@/components/kling/MotionPanel.vue';
import TabSwitcher from '@/components/kling/TabSwitcher.vue';
import { klingOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IKlingGenerateRequest, IKlingMotionRequest, IKlingTaskType, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP, getWebhookCallbackUrl } from '@/constants';
import RecentPanel from '@/components/kling/RecentPanel.vue';
import { IKlingTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';

const CALLBACK_URL = getWebhookCallbackUrl('kling');

interface IData {
  task: IKlingTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
}

export default defineComponent({
  name: 'KlingIndex',
  components: {
    ConfigPanel,
    MotionPanel,
    TabSwitcher,
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
      return this.$store.state.kling?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.kling?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.kling.credential;
    },
    config() {
      return this.$store.state.kling.config;
    },
    motionConfig() {
      return this.$store.state.kling.motionConfig;
    },
    taskType(): IKlingTaskType {
      return this.$store.state.kling.taskType || 'videos';
    },
    tasks() {
      return this.$store.state.kling.tasks;
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
      console.debug('start onGetService');
      await this.$store.dispatch('kling/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('kling/getApplications');
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
      if (this.applicationsLoading || this.fetchingTasks) {
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 5, createdAtMin, createdAtMax } = payload || {};
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      this.fetchingTasks = true;
      try {
        await this.$store.dispatch('kling/getTasks', {
          limit,
          createdAtMin,
          createdAtMax
        });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerate() {
      const { camera_control, ...rest } = this.config || {};
      const request = {
        ...rest,
        callback_url: CALLBACK_URL
      } as IKlingGenerateRequest;
      // Reject "only end frame, no start frame" — Kling can't anchor an
      // end-frame without a starting reference.
      if (!request.video_id && !(rest as any).video_url && !request.start_image_url && request.end_image_url) {
        ElMessage.warning(this.$t('kling.message.endImageRequiresStart'));
        return;
      }
      // Derive `action` from inputs if the user did not set one explicitly.
      // Upstream Kling worker requires `action` and defaults to `text2video`,
      // which rejects `start_image_url`/`end_image_url` (#bug: image refs ignored).
      if (!request.action) {
        if (request.video_id || (rest as any).video_url) {
          request.action = 'extend';
        } else if (request.start_image_url) {
          request.action = 'image2video';
        } else {
          request.action = 'text2video';
        }
      }
      // text2video does not accept end_image_url; strip it to avoid a 400.
      if (request.action === 'text2video' && request.end_image_url) {
        delete request.end_image_url;
      }
      // Only include camera_control when a type is set; clean empty config blocks.
      if (camera_control?.type) {
        request.camera_control = {
          type: camera_control.type,
          ...(camera_control.type === 'simple' && camera_control.config
            ? {
                config: Object.fromEntries(
                  Object.entries(camera_control.config).filter(([, v]) => v !== undefined && v !== null)
                )
              }
            : {})
        };
      }
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('kling.message.startingTask'));
      instrumentGeneration('kling', klingOperator.generate(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('kling.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('kling.message.usedUp'));
          } else {
            ElMessage.error(this.$t('kling.message.startTaskFailed'));
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
    },
    async onTabChange(value: IKlingTaskType) {
      if (value === this.taskType) return;
      await this.$store.dispatch('kling/setTaskType', value);
      // taskType change clears tasks; re-fetch.
      await this.onGetTasks();
      await this.onScrollDown();
    },
    async onGenerateMotion() {
      const cfg = this.motionConfig || {};
      if (!cfg.image_url || !cfg.video_url) {
        ElMessage.warning(this.$t('kling.message.motionMissingInputs'));
        return;
      }
      const request: IKlingMotionRequest = {
        image_url: cfg.image_url,
        video_url: cfg.video_url,
        character_orientation: cfg.character_orientation || 'video',
        mode: cfg.mode || 'std',
        keep_original_sound: cfg.keep_original_sound ?? 'yes',
        ...(cfg.prompt ? { prompt: cfg.prompt } : {}),
        callback_url: CALLBACK_URL
      };
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('kling.message.startingTask'));
      instrumentGeneration('kling', klingOperator.motion(request, { token }))
        .then(() => {
          ElMessage.success(this.$t('kling.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('kling.message.usedUp'));
          } else {
            ElMessage.error(this.$t('kling.message.startTaskFailed'));
          }
        })
        .finally(async () => {
          setTimeout(async () => {
            await this.onGetTasks();
            await this.onScrollDown();
          }, 1000);
        });
    }
  }
});
</script>
