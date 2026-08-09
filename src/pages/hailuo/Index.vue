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
import Layout from '@/layouts/Hailuo.vue';
import ConfigPanel from '@/components/hailuo/ConfigPanel.vue';
import { buildHailuoRequest, hailuoOperator } from '@/operators/hailuo';
import { instrumentGeneration } from '@/plugins/telemetry';
import { Status } from '@/models';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/hailuo/RecentPanel.vue';
import { IHailuoTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';

interface IData {
  task: IHailuoTask | undefined;
  job: number;
  loadingMore: boolean;
  fetchingTasks: boolean;
  walletTaskIds: string[];
}

export default defineComponent({
  name: 'HailuoIndex',
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
      // @ts-ignore
      timer: undefined,
      loadingMore: false,
      fetchingTasks: false,
      walletTaskIds: []
    };
  },
  computed: {
    applicationsLoading() {
      return this.$store.state.hailuo?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.hailuo?.status?.getTasks === Status.Request || this.fetchingTasks;
    },
    credential() {
      return this.$store.state.hailuo.credential;
    },
    config() {
      return this.$store.state.hailuo.config;
    },
    application() {
      return this.$store.state.hailuo.application;
    },
    tasks() {
      return this.$store.state.hailuo.tasks;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('hailuo').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      async handler(value: boolean, oldValue: boolean | undefined) {
        if (oldValue === undefined || value === oldValue) return;
        this.$store.commit('hailuo/setTasks', undefined);
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
      await this.$store.dispatch('hailuo/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('hailuo/getApplications');
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
        await this.$store.dispatch('hailuo/getTasks', {
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
      const request = buildHailuoRequest(this.config);
      let operation: Promise<unknown>;
      if (this.walletMode) {
        const wallet = this.getWalletContext();
        if (!wallet) {
          ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
          return;
        }
        operation = hailuoOperator.generate(request, {
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
        operation = hailuoOperator.generate(request, { token });
      }
      ElMessage.info(this.$t('hailuo.message.startingTask'));
      instrumentGeneration('hailuo', operation)
        .then((response: any) => {
          const taskId = response?.data?.task_id;
          if (this.walletMode && !this.credential?.token && taskId && !this.walletTaskIds.includes(taskId)) {
            this.walletTaskIds.unshift(taskId);
          }
          ElMessage.success(this.$t('hailuo.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (error instanceof X402PaymentCancelledError) return;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('hailuo.message.usedUp'));
          } else if (this.walletMode) {
            ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
          } else {
            ElMessage.error(this.$t('hailuo.message.startTaskFailed'));
          }
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
