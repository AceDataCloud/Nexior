<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerateAudio" />
    </template>
    <template #result>
      <recent-panel
        ref="recentPanel"
        class="panel recent"
        :loading="loadingMore"
        @reach-top="onReachTop"
        @wallet-task="onWalletTask"
      />
    </template>
    <template #preview>
      <preview-panel />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Producer.vue';
import { applicationOperator } from '@/operators';
import { buildProducerAudioRequest, producerOperator } from '@/operators/producer';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IApplicationDetailResponse, Status } from '@/models';
import { ElMessage, ElMessageBox } from 'element-plus';
import { IProducerTask } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants';
import ConfigPanel from '@/components/producer/ConfigPanel.vue';
import RecentPanel from '@/components/producer/RecentPanel.vue';
import PreviewPanel from '@/components/producer/PreviewPanel.vue';
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
  task: IProducerTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
  walletTaskIds: string[];
}

export default defineComponent({
  name: 'ProducerIndex',
  components: {
    Layout,
    ConfigPanel,
    RecentPanel,
    PreviewPanel
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
      return this.$store.state.producer?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.producer?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    service() {
      return this.$store.state.producer.service;
    },
    credential() {
      return this.$store.state.producer.credential;
    },
    config() {
      return this.$store.state.producer.config;
    },
    initializing() {
      return this.$store.state.producer.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.producer.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.producer.application;
    },
    tasks() {
      return this.$store.state.producer.tasks;
    },
    applications() {
      return this.$store.state.producer.applications;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('producer').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      async handler(value: boolean, oldValue: boolean | undefined) {
        if (oldValue === undefined || value === oldValue) return;
        this.$store.commit('producer/setTasks', undefined);
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
      await this.$store.dispatch('producer/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplications');
      await this.$store.dispatch('producer/getApplications');
      console.debug('end onGetApplications');
      await this.onGetTasks();
    },
    onApply() {
      applicationOperator
        .create({
          // @ts-ignore
          application: this.application
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          ElMessage.success(this.$t('application.message.applySuccessfully'));
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
        });
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
        await this.$store.dispatch('producer/getTasks', {
          limit,
          createdAtMin,
          createdAtMax,
          ...(this.walletMode && !this.credential?.token ? { mode: 'x402', ids: this.walletTaskIds } : {})
        });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerateAudio() {
      if (
        !ensureNoPendingUpload(
          this.uploadTracker,
          (k) => this.$t(k) as string,
          (m) => ElMessage.warning(m)
        )
      ) {
        return;
      }
      const request = buildProducerAudioRequest(this.config);
      const operation = this.createPaymentOperation((options) => producerOperator.audio(request, options));
      if (!operation) return;
      ElMessage.info(this.$t('producer.message.startingTask'));
      try {
        const response = await instrumentGeneration('producer', operation);
        this.recordWalletTask(response);
        ElMessage.success(this.$t('producer.message.startTaskSuccess'));
      } catch (error) {
        this.handlePaymentError(error);
      } finally {
        setTimeout(async () => {
          await this.onGetTasks();
          await this.onScrollDown();
        }, 1000);
      }
    },
    createPaymentOperation(submit: (options: OperatorRequestOptions) => Promise<any>): Promise<any> | undefined {
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
        x402: { wallet, confirm: (quote) => this.confirmWalletPayment(quote), identityToken: this.credential?.token }
      });
    },
    recordWalletTask(response: any) {
      this.onWalletTask(response?.data?.task_id);
    },
    onWalletTask(taskId: string | undefined) {
      if (this.walletMode && !this.credential?.token && taskId && !this.walletTaskIds.includes(taskId)) {
        this.walletTaskIds.unshift(taskId);
      }
    },
    handlePaymentError(error: any) {
      if (error instanceof X402PaymentCancelledError) return;
      if (this.walletMode)
        ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
      else ElMessage.error(error?.response?.data?.error?.message || this.$t('producer.message.startTaskFailed'));
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
    }
  }
});
</script>

<style lang="scss" scoped>
.status {
  margin-bottom: 10px;
}

.panel {
  &.detail {
    width: 100%;
    flex: 1;
    overflow-y: scroll;
  }
  &.recent {
    height: 100%;
    width: 100%;
    margin-bottom: 10px;
    position: relative;
    justify-content: initial;
  }
  &.operation {
    position: relative;
  }
}
</style>
