<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #results>
      <task-list ref="taskList" :loading="loadingMore" @custom="onCustom" @reach-top="onReachTop" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Midjourney.vue';
import ConfigPanel from '@/components/midjourney/ConfigPanel.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  buildMidjourneyCustomRequest,
  buildMidjourneyDescribeRequest,
  buildMidjourneyImagineRequest,
  buildMidjourneyVideosRequest,
  midjourneyOperator
} from '@/operators/midjourney';
import { instrumentGeneration } from '@/plugins/telemetry';
import TaskList from '@/components/midjourney/tasks/TaskList.vue';
import { ERROR_CODE_USED_UP } from '@/constants/errorCode';
import { MidjourneyVideosAction, Status } from '@/models';
import {
  IMidjourneyImagineRequest,
  IMidjourneyVideosRequest,
  MidjourneyImagineAction,
  IMidjourneyDescribeRequest
} from '@/models';

import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type OperatorRequestOptions,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';

interface IData {
  operating: boolean;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
  walletTaskIds: string[];
}

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    ConfigPanel,
    TaskList,
    Layout
  },
  mixins: [uploadTrackerProviderMixin],
  inject: ['initialized'],
  data(): IData {
    return {
      operating: false,
      job: 0,
      loadingMore: false,
      fetchingTasks: false,
      walletTaskIds: []
    };
  },
  computed: {
    tasks() {
      return this.$store.state.midjourney.tasks;
    },
    credential() {
      return this.$store.state.midjourney.credential;
    },
    config() {
      return this.$store.state.midjourney.config;
    },
    loading() {
      return this.$store.state.midjourney.status.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.midjourney.status.getTasks === Status.Request || this.fetchingTasks;
    },
    application() {
      return this.$store.state.midjourney.application;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('midjourney').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      async handler(value: boolean, oldValue: boolean | undefined) {
        if (oldValue === undefined || value === oldValue) return;
        this.$store.commit('midjourney/setTasks', undefined);
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
        getTasks: () => this.tasks,
        loading: this.loadingMore,
        setLoading: (v) => (this.loadingMore = v),
        isBlocked: () => this.tasksLoading || this.loading,
        fetch: (createdAtMax) =>
          this.onGetTasks({
            createdAtMax
          }),
        getScrollElement: () => this.getTasksScrollElement()
      });
    },
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('midjourney/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplications');
      await this.$store.dispatch('midjourney/getApplications');
      console.debug('end onGetApplications');
      await this.onGetTasks();
    },
    async onStartImagineTask(request: IMidjourneyImagineRequest) {
      if (!request.prompt && request.action === MidjourneyImagineAction.GENERATE) {
        ElMessage.error(this.$t('midjourney.message.promptRequired'));
        return;
      }
      await this.startPaidTask(
        (options) => midjourneyOperator.imagine(request, options),
        'midjourney.message.startTaskSuccess',
        'midjourney.message.startTaskFailed'
      );
    },
    async onStartVideosTask(request: IMidjourneyVideosRequest) {
      if (!request.prompt) {
        ElMessage.error(this.$t('midjourney.message.promptRequired'));
        return;
      }
      // Midjourney video generation is image-to-video only; pure text-to-video is not supported.
      // For action=extend, image_url is replaced by video_id.
      if (request.action !== MidjourneyVideosAction.EXTEND && !request.image_url) {
        ElMessage.error(this.$t('midjourney.message.imageUrlRequired'));
        return;
      }
      await this.startPaidTask(
        (options) => midjourneyOperator.videos(request, options),
        'midjourney.message.startVideosTaskSuccess',
        'midjourney.message.startVideosTaskFailed'
      );
    },
    async onStartDescribeTask(request: IMidjourneyDescribeRequest) {
      await this.startPaidTask(
        (options) => midjourneyOperator.describe(request, options),
        'midjourney.message.startDescribeTaskSuccess',
        'midjourney.message.startDescribeTaskFailed'
      );
    },
    async onCustom(payload: { image_id: string; action: MidjourneyImagineAction }) {
      const request = buildMidjourneyCustomRequest(this.config, payload);
      this.onStartImagineTask(request);
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
      console.debug('onGenerate', this.config);
      if (this.config?.type === 'videos') {
        const request = buildMidjourneyVideosRequest(this.config);
        await this.onStartVideosTask(request);
      } else if (this.config?.type === 'imagine') {
        const request = buildMidjourneyImagineRequest(this.config);
        await this.onStartImagineTask(request);
      } else if (this.config?.type === 'describe') {
        if (!this.config?.image_url) {
          ElMessage.error(this.$t('midjourney.message.imageUrlRequired'));
          return;
        }
        const request = buildMidjourneyDescribeRequest(this.config);
        await this.onStartDescribeTask(request);
      }
    },
    paymentOptions(): OperatorRequestOptions | undefined {
      if (!this.walletMode) {
        if (!ensureLoggedIn()) return undefined;
        const token = this.credential?.token;
        return token ? { token } : undefined;
      }
      const wallet = this.getWalletContext();
      if (!wallet) {
        ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
        return undefined;
      }
      return {
        mode: 'x402',
        x402: {
          wallet,
          confirm: (quote) => this.confirmWalletPayment(quote),
          identityToken: this.credential?.token
        }
      };
    },
    async startPaidTask(
      submit: (options: OperatorRequestOptions) => Promise<unknown>,
      successKey: string,
      failureKey: string
    ) {
      const options = this.paymentOptions();
      if (!options) return;
      ElMessage.info(this.$t('midjourney.message.startingTask'));
      try {
        const response: any = await instrumentGeneration('midjourney', submit(options));
        const taskId = response?.data?.task_id;
        if (this.walletMode && !this.credential?.token && taskId && !this.walletTaskIds.includes(taskId)) {
          this.walletTaskIds.unshift(taskId);
        }
        ElMessage.success(this.$t(successKey));
      } catch (error: any) {
        if (error instanceof X402PaymentCancelledError) return;
        if (error?.response?.data?.error?.code === ERROR_CODE_USED_UP) {
          ElMessage.error(this.$t('midjourney.message.usedUp'));
        } else if (this.walletMode) {
          ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
        } else {
          ElMessage.error(this.$t(failureKey) + (error?.response?.data?.error?.message || ''));
        }
      } finally {
        setTimeout(async () => {
          await this.onGetTasks();
          await this.onScrollDown();
        }, 1000);
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
    async onScrollDown() {
      await this.$nextTick();
      const el = this.getTasksScrollElement();
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number }) {
      if (this.loading || this.fetchingTasks) {
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 5, createdAtMin, createdAtMax } = payload || {};
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      this.fetchingTasks = true;
      try {
        await this.$store.dispatch('midjourney/getTasks', {
          limit,
          createdAtMin,
          createdAtMax,
          ...(this.walletMode && !this.credential?.token ? { mode: 'x402', ids: this.walletTaskIds } : {})
        });
      } finally {
        this.fetchingTasks = false;
      }
      // await this.$store.dispatch('midjourney/getTasks', {
      //   limit: 30,
      //   offset: 0
      // });
    },
    getTasksScrollElement(): HTMLElement | undefined {
      const list = this.$refs.taskList as any;
      return list?.getScrollElement?.();
    }
  }
});
</script>
