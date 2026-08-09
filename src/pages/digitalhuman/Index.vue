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
import Layout from '@/layouts/DigitalHuman.vue';
import ConfigPanel from '@/components/digitalhuman/ConfigPanel.vue';
import RecentPanel from '@/components/digitalhuman/RecentPanel.vue';
import { digitalHumanOperator } from '@/operators/digitalhuman';
import { ensureLoggedIn, ensureNoPendingUpload, uploadTrackerProviderMixin } from '@/utils';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IDigitalHumanGenerateRequest, Status } from '@/models';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import { loadPreviousPage } from '@/utils/pagination';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';

interface IData {
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
  walletTaskIds: string[];
}

export default defineComponent({
  name: 'DigitalHumanIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel
  },
  mixins: [uploadTrackerProviderMixin],
  inject: ['initialized'],
  data(): IData {
    return {
      job: 0,
      loadingMore: false,
      fetchingTasks: false,
      walletTaskIds: []
    };
  },
  computed: {
    applicationsLoading() {
      return this.$store.state.digitalhuman?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.digitalhuman?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.digitalhuman.credential;
    },
    config() {
      return this.$store.state.digitalhuman.config;
    },
    tasks() {
      return this.$store.state.digitalhuman.tasks;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('digitalhuman').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      async handler(value: boolean, oldValue: boolean | undefined) {
        if (oldValue === undefined || value === oldValue) return;
        this.$store.commit('digitalhuman/setTasks', undefined);
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
        window.clearInterval(this.job);
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
  },
  methods: {
    async onReachTop() {
      await loadPreviousPage({
        tasks: this.tasks,
        getTasks: () => this.tasks,
        loading: this.loadingMore,
        setLoading: (v) => (this.loadingMore = v),
        isBlocked: () => this.tasksLoading || this.applicationsLoading,
        fetch: (createdAtMax) => this.onGetTasks({ createdAtMax }),
        getScrollElement: () => this.getTasksScrollElement()
      });
    },
    async onGetService() {
      await this.$store.dispatch('digitalhuman/getService');
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
        await this.$store.dispatch('digitalhuman/getTasks', {
          limit,
          createdAtMin,
          createdAtMax,
          ...(this.walletMode && !this.credential?.token ? { mode: 'x402', ids: this.walletTaskIds } : {})
        });
      } finally {
        this.fetchingTasks = false;
      }
    },
    async onGenerate(request: IDigitalHumanGenerateRequest) {
      if (
        !ensureNoPendingUpload(
          this.uploadTracker,
          (k) => this.$t(k) as string,
          (m) => ElMessage.warning(m)
        )
      ) {
        return;
      }
      let operation: Promise<unknown>;
      if (this.walletMode) {
        const wallet = this.getWalletContext();
        if (!wallet) {
          ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
          return;
        }
        operation = digitalHumanOperator.generate(request, {
          mode: 'x402',
          x402: { wallet, confirm: (quote) => this.confirmWalletPayment(quote), identityToken: this.credential?.token }
        });
      } else {
        if (!ensureLoggedIn()) return;
        const token = this.credential?.token;
        if (!token) return;
        operation = digitalHumanOperator.generate(request, { token });
      }
      ElMessage.info(this.$t('digitalhuman.message.startingTask'));
      instrumentGeneration('digitalhuman', operation)
        .then((response: any) => {
          const taskId = response?.data?.task_id;
          if (this.walletMode && !this.credential?.token && taskId && !this.walletTaskIds.includes(taskId))
            this.walletTaskIds.unshift(taskId);
          ElMessage.success(this.$t('digitalhuman.message.startTaskSuccess'));
        })
        .catch((error) => {
          if (error instanceof X402PaymentCancelledError) return;
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) ElMessage.error(this.$t('digitalhuman.message.usedUp'));
          else if (this.walletMode)
            ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
          else ElMessage.error(this.$t('digitalhuman.message.startTaskFailed'));
        })
        .finally(async () => {
          setTimeout(async () => {
            await this.onGetTasks();
            await this.onScrollDown();
          }, 1000);
        });
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
