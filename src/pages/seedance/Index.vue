<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <recent-panel ref="recentPanel" :loading="loadingMore" @reach-top="onReachTop" />
    </template>
  </layout>
  <quota-exhausted-dialog
    :model-value="quotaDialogVisible"
    :estimated-consumption="quotaEstimatedConsumption"
    :available-credits="quotaAvailableCredits"
    :balance-state="quotaBalanceState"
    :unit="service?.unit"
    :can-top-up="canTopUp"
    @update:model-value="onQuotaDialogVisibility"
    @top-up="onTopUp"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Seedance.vue';
import ConfigPanel from '@/components/seedance/ConfigPanel.vue';
import RecentPanel from '@/components/seedance/RecentPanel.vue';
import QuotaExhaustedDialog, { type QuotaBalanceState } from '@/components/seedance/QuotaExhaustedDialog.vue';
import { seedanceOperator } from '@/operators/seedance';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IApplication, Status } from '@/models';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import { ISeedanceTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';
import { normalizeSeedanceRequest } from '@/utils/seedance';
import { showcaseRecreateMixin } from '@/utils/showcaseRecreateMixin';
import {
  canPurchaseApplication,
  ensureLoggedIn,
  ensureNoPendingUpload,
  getEffectiveApplicationBalance,
  getApplicationPurchaseRoute,
  isIOS,
  uploadTrackerProviderMixin
} from '@/utils';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';

interface IData {
  task: ISeedanceTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
  walletTaskIds: string[];
  quotaDialogVisible: boolean;
  quotaEstimatedConsumption: number | undefined;
  quotaAvailableCredits: number | undefined;
  quotaBalanceState: QuotaBalanceState;
  quotaApplication: IApplication | undefined;
  quotaRefreshRunId: number;
}

export default defineComponent({
  name: 'SeedanceIndex',
  components: {
    ConfigPanel,
    Layout,
    QuotaExhaustedDialog,
    RecentPanel
  },
  mixins: [uploadTrackerProviderMixin, showcaseRecreateMixin('seedance')],
  inject: ['initialized'],
  data(): IData {
    return {
      task: undefined,
      job: 0,
      loadingMore: false,
      fetchingTasks: false,
      walletTaskIds: [],
      quotaDialogVisible: false,
      quotaEstimatedConsumption: undefined,
      quotaAvailableCredits: undefined,
      quotaBalanceState: 'unavailable',
      quotaApplication: undefined,
      quotaRefreshRunId: 0
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
    service() {
      return this.$store.state.seedance?.service;
    },
    canTopUp(): boolean {
      return canPurchaseApplication(this.quotaApplication, this.$store.getters.site, { ios: isIOS() });
    },
    tasks() {
      return this.$store.state.seedance?.tasks;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('seedance').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      async handler(value: boolean, oldValue: boolean | undefined) {
        if (oldValue === undefined || value === oldValue) return;
        this.$store.commit('seedance/setTasks', undefined);
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
    initialized: {
      async handler(newValue) {
        if (newValue) {
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
    this.quotaRefreshRunId += 1;
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
          createdAtMax,
          ...(this.walletMode && !this.credential?.token ? { mode: 'x402', ids: this.walletTaskIds } : {})
        });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerate(estimatedConsumption?: number) {
      if (
        !ensureNoPendingUpload(
          this.uploadTracker,
          (k) => this.$t(k) as string,
          (m) => ElMessage.warning(m)
        )
      ) {
        return;
      }
      const { request, reject } = normalizeSeedanceRequest(this.config);
      if (reject) {
        ElMessage.warning(this.$t(`seedance.message.${reject}`));
        return;
      }
      if (!request) {
        return;
      }

      let operation: Promise<unknown>;
      if (this.walletMode) {
        const wallet = this.getWalletContext();
        if (!wallet) {
          ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
          return;
        }
        operation = seedanceOperator.generate(request, {
          mode: 'x402',
          x402: {
            wallet,
            confirm: (quote) => this.confirmWalletPayment(quote),
            identityToken: this.credential?.token
          }
        });
      } else {
        if (!ensureLoggedIn()) return;
        const token = this.credential?.token;
        if (!token) return;
        operation = seedanceOperator.generate(request, { token });
      }
      const startingMessage = ElMessage.info(this.$t('seedance.message.startingTask'));
      instrumentGeneration('seedance', operation)
        .then((response: any) => {
          startingMessage.close();
          const taskId = response?.data?.task_id;
          if (this.walletMode && !this.credential?.token && taskId && !this.walletTaskIds.includes(taskId)) {
            this.walletTaskIds.unshift(taskId);
          }
          ElMessage.success(this.$t('seedance.message.startTaskSuccess'));
        })
        .catch((error) => {
          startingMessage.close();
          const response = error?.response?.data;
          if (error instanceof X402PaymentCancelledError) return;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            void this.onQuotaExhausted(estimatedConsumption);
          } else if (this.walletMode) {
            ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
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
    async onQuotaExhausted(estimatedConsumption?: number) {
      const selectedApplication = this.$store.state.seedance?.application as IApplication | undefined;
      const runId = ++this.quotaRefreshRunId;
      this.quotaEstimatedConsumption = estimatedConsumption;
      this.quotaAvailableCredits = undefined;
      this.quotaBalanceState = 'refreshing';
      this.quotaApplication = selectedApplication;
      this.quotaDialogVisible = true;

      const [globalApplications, serviceApplications] = await Promise.all([
        this.$store.dispatch('getApplications'),
        this.$store.dispatch('seedance/getApplications')
      ]);
      if (runId !== this.quotaRefreshRunId) return;
      if (!Array.isArray(globalApplications) || !Array.isArray(serviceApplications) || !selectedApplication?.id) {
        this.quotaBalanceState = 'unavailable';
        return;
      }

      const freshApplication = [...globalApplications, ...serviceApplications].find(
        (application) => application.id === selectedApplication.id
      );
      if (!freshApplication) {
        this.quotaBalanceState = 'unavailable';
        return;
      }

      this.$store.commit('seedance/setApplication', freshApplication);
      this.quotaApplication = freshApplication;
      this.quotaAvailableCredits = getEffectiveApplicationBalance(freshApplication, globalApplications);
      this.quotaBalanceState = 'current';
    },
    onQuotaDialogVisibility(visible: boolean) {
      this.quotaDialogVisible = visible;
      if (!visible) this.quotaRefreshRunId += 1;
    },
    onTopUp() {
      if (!canPurchaseApplication(this.quotaApplication, this.$store.getters.site, { ios: isIOS() })) return;
      const target = getApplicationPurchaseRoute(this.quotaApplication);
      if (!target) return;
      this.onQuotaDialogVisibility(false);
      this.$router.push(target);
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
