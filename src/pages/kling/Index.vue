<template>
  <layout>
    <template #config>
      <div class="flex flex-col h-full">
        <tab-switcher :model-value="taskType" @update:model-value="onTabChange" />
        <div class="flex-1 min-h-0">
          <config-panel v-if="taskType === 'videos'" @generate="onGenerate" />
          <motion-panel v-else-if="taskType === 'motion'" @generate="onGenerateMotion" />
          <talking-photo-panel v-else-if="taskType === 'talking-photo'" @generate="onGenerateTalkingPhoto" />
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
import TalkingPhotoPanel from '@/components/kling/TalkingPhotoPanel.vue';
import { buildKlingTalkingPhotoRequest, buildKlingVideoRequest, klingOperator } from '@/operators/kling';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IKlingMotionRequest, IKlingTaskType, Status } from '@/models';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/kling/RecentPanel.vue';
import { IKlingTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';
import { isScenarioX402Enabled, scenarioPaymentState, setScenarioPaymentMode } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type OperatorRequestOptions,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';

interface IData {
  task: IKlingTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
  walletTaskIds: string[];
}

export default defineComponent({
  name: 'KlingIndex',
  components: {
    ConfigPanel,
    MotionPanel,
    TalkingPhotoPanel,
    TabSwitcher,
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
      fetchingTasks: false,
      walletTaskIds: []
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
    talkingPhotoConfig() {
      return this.$store.state.kling.talkingPhotoConfig;
    },
    taskType(): IKlingTaskType {
      return this.$store.state.kling.taskType || 'videos';
    },
    tasks() {
      return this.$store.state.kling.tasks;
    },
    walletMode(): boolean {
      return this.taskType !== 'motion' && isScenarioX402Enabled() && scenarioPaymentState('kling').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      async handler(value: boolean, oldValue: boolean | undefined) {
        if (oldValue === undefined || value === oldValue) return;
        this.$store.commit('kling/setTasks', undefined);
        if (value && !this.job) this.job = window.setInterval(this.onGetTasks, 5000);
        if (!value && !this.credential?.token) {
          window.clearInterval(this.job);
          this.job = 0;
          await this.onScrollDown();
          return;
        }
        await this.onGetTasks();
        await this.onScrollDown();
      }
    },
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
          if (!this.job) this.job = window.setInterval(this.onGetTasks, 5000);
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
          createdAtMax,
          ...(this.walletMode && !this.credential?.token ? { mode: 'x402', ids: this.walletTaskIds } : {})
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
      const request = buildKlingVideoRequest(this.config);
      const frameCount = Number(Boolean(request.start_image_url)) + Number(Boolean(request.end_image_url));
      const referenceImageCount = request.image_list?.length || 0;
      const maxReferenceImages = request.video_list?.length ? 4 : 7;
      if (frameCount + referenceImageCount > maxReferenceImages) {
        ElMessage.warning(this.$t('kling.message.referenceImagesTotalLimit', { count: maxReferenceImages }));
        return;
      }
      if (
        request.video_list?.[0]?.refer_type === 'base' &&
        (request.start_image_url || request.end_image_url || request.image_list?.some(({ type }) => type))
      ) {
        ElMessage.warning(this.$t('kling.message.baseVideoFrameConflict'));
        return;
      }
      if (!request.video_id && !request.video_url && !request.start_image_url && request.end_image_url) {
        ElMessage.warning(this.$t('kling.message.endImageRequiresStart'));
        return;
      }
      const operation = this.createPaymentOperation((options) => klingOperator.generate(request, options));
      if (!operation) return;
      ElMessage.info(this.$t('kling.message.startingTask'));
      instrumentGeneration('kling', operation)
        .then((response: any) => {
          this.recordWalletTask(response);
          ElMessage.success(this.$t('kling.message.startTaskSuccess'));
        })
        .catch((error) => this.handleGenerationError(error))
        .finally(async () => {
          setTimeout(async () => {
            await this.onGetTasks();
            await this.onScrollDown();
          }, 1000);
        });
    },
    createPaymentOperation(
      submit: (options: OperatorRequestOptions) => Promise<unknown>
    ): Promise<unknown> | undefined {
      if (!this.walletMode) {
        if (!ensureLoggedIn()) return undefined;
        const token = this.credential?.token;
        return token ? submit({ token }) : undefined;
      }
      const wallet = this.getWalletContext();
      if (!wallet) {
        ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
        return undefined;
      }
      return submit({
        mode: 'x402',
        x402: {
          wallet,
          confirm: (quote) => this.confirmWalletPayment(quote),
          identityToken: this.credential?.token
        }
      });
    },
    recordWalletTask(response: any) {
      const taskId = response?.data?.task_id;
      if (this.walletMode && !this.credential?.token && taskId && !this.walletTaskIds.includes(taskId)) {
        this.walletTaskIds.unshift(taskId);
      }
    },
    handleGenerationError(error: any) {
      if (error instanceof X402PaymentCancelledError) return;
      const response = error?.response?.data;
      if (response?.error?.code === ERROR_CODE_USED_UP) {
        ElMessage.error(this.$t('kling.message.usedUp'));
      } else if (this.walletMode) {
        ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
      } else {
        ElMessage.error(this.$t('kling.message.startTaskFailed'));
      }
    },
    getWalletContext(): X402WalletContext | undefined {
      return resolveX402WalletContext((this as any).$wallet);
    },
    async confirmWalletPayment(quote: X402PaymentQuote): Promise<boolean> {
      return ElMessageBox.confirm(
        this.$t('common.x402Scenario.confirmPayment', { amount: quote.amountUsdc }),
        this.$t('order.message.x402ConfirmTitle'),
        {
          confirmButtonText: this.$t('order.message.x402WalletPayCta'),
          cancelButtonText: this.$t('common.button.cancel'),
          type: 'warning'
        }
      )
        .then(() => true)
        .catch(() => false);
    },
    getTasksScrollElement(): HTMLElement | undefined {
      const panel = this.$refs.recentPanel as any;
      return panel?.getScrollElement?.();
    },
    async onTabChange(value: IKlingTaskType) {
      if (value === this.taskType) return;
      if (value === 'motion') setScenarioPaymentMode('kling', 'credits');
      await this.$store.dispatch('kling/setTaskType', value);
      // taskType change clears tasks; re-fetch.
      await this.onGetTasks();
      await this.onScrollDown();
    },
    async onGenerateMotion() {
      if (
        !ensureNoPendingUpload(
          this.uploadTracker,
          (k) => this.$t(k) as string,
          (m) => ElMessage.warning(m)
        )
      ) {
        return;
      }
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
        ...(cfg.model_name ? { model_name: cfg.model_name } : {}),
        ...(cfg.prompt ? { prompt: cfg.prompt } : {}),
        async: true
      };
      if (!ensureLoggedIn()) {
        return;
      }
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
    },
    async onGenerateTalkingPhoto() {
      if (
        !ensureNoPendingUpload(
          this.uploadTracker,
          (k) => this.$t(k) as string,
          (m) => ElMessage.warning(m)
        )
      ) {
        return;
      }
      const cfg = this.talkingPhotoConfig || {};
      if (!cfg.image_url || !cfg.audio_url) {
        ElMessage.warning(this.$t('kling.message.talkingPhotoMissingInputs'));
        return;
      }
      const request = buildKlingTalkingPhotoRequest(cfg);
      const operation = this.createPaymentOperation((options) => klingOperator.talkingPhoto(request, options));
      if (!operation) return;
      ElMessage.info(this.$t('kling.message.startingTask'));
      instrumentGeneration('kling', operation)
        .then((response: any) => {
          this.recordWalletTask(response);
          ElMessage.success(this.$t('kling.message.startTaskSuccess'));
        })
        .catch((error) => this.handleGenerationError(error))
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
