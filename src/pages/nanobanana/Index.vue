<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" @payment-mode-change="onPaymentModeChange" />
    </template>
    <template #result>
      <recent-panel ref="recentPanel" :loading="loading" @reach-top="onReachTop" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Nanobanana.vue';
import ConfigPanel from '@/components/nanobanana/ConfigPanel.vue';
import { nanobananaOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { INanobananaGenerateRequest, Status } from '@/models';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ERROR_CODE_USED_UP,
  NANOBANANA_DEFAULT_RESOLUTION,
  NANOBANANA_MODEL_NANO_BANANA_2,
  NANOBANANA_MODEL_NANO_BANANA_PRO
} from '@/constants';
import RecentPanel from '@/components/nanobanana/RecentPanel.vue';
import { INanobananaTask } from '@/models';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';
import { mergeAndSortLists } from '@/utils/merge';
import { isScenarioX402Enabled, scenarioPaymentMode } from '@/utils/x402/scenarioPayment';
import {
  listWalletTasks,
  rememberWalletTask,
  ScenarioPaymentCancelledError,
  submitNanoWithX402,
  walletTaskIds,
  type ScenarioPaymentQuote,
  type ScenarioWalletContext
} from '@/utils/x402/scenarioClient';

interface IData {
  task: INanobananaTask | undefined;
  job: number;
  loading: boolean;
}

export default defineComponent({
  name: 'NanobananaIndex',
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
      loading: false
    };
  },
  computed: {
    applicationsLoading() {
      return this.$store.state.nanobanana?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.nanobanana?.status?.getTasks === Status.Request;
    },
    credential() {
      return this.$store.state.nanobanana?.credential;
    },
    config() {
      return this.$store.state.nanobanana?.config;
    },
    application() {
      return this.$store.state.nanobanana?.application;
    },
    tasks() {
      return this.$store.state.nanobanana?.tasks;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentMode.value === 'wallet';
    },
    walletAddress(): string | undefined {
      return (this as any).$wallet?.publicKey?.value?.toBase58?.();
    }
  },
  watch: {
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
        getTasks: () => this.tasks,
        loading: this.loading,
        setLoading: (v) => (this.loading = v),
        isBlocked: () => this.tasksLoading,
        fetch: (createdAtMax) => this.onGetTasks({ createdAtMax }),
        getScrollElement: () => this.getTasksScrollElement()
      });
    },
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('nanobanana/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('nanobanana/getApplications');
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
      if (this.applicationsLoading || this.tasksLoading) {
        console.debug('loading');
        return;
      }
      const { limit = 20, createdAtMin, createdAtMax } = payload || {};
      if (this.walletMode) {
        if (!this.walletAddress) return;
        const response = await listWalletTasks<INanobananaTask>(
          'nano-banana',
          walletTaskIds('nano-banana', this.walletAddress),
          {
            limit,
            createdAtMin,
            createdAtMax
          }
        );
        const existing = this.tasks?.items || [];
        this.$store.commit('nanobanana/setTasksItems', mergeAndSortLists(existing, response.items));
        this.$store.commit('nanobanana/setTasksTotal', response.count);
        return;
      }
      await this.$store.dispatch('nanobanana/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
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
      const hasReferenceImages = Array.isArray(cfg?.image_urls) && cfg.image_urls.length > 0;
      delete cfg.action;
      // If creating new images, omit reference images from payload
      if (!hasReferenceImages && 'image_urls' in cfg) {
        delete cfg.image_urls;
      }
      if (!cfg?.aspect_ratio) {
        delete cfg.aspect_ratio;
      }
      const supportsResolution =
        cfg?.model === NANOBANANA_MODEL_NANO_BANANA_2 || cfg?.model === NANOBANANA_MODEL_NANO_BANANA_PRO;
      if (!supportsResolution && 'resolution' in cfg) {
        delete cfg.resolution;
      }
      if (supportsResolution && !cfg?.resolution) {
        cfg.resolution = NANOBANANA_DEFAULT_RESOLUTION;
      }
      const request = {
        ...cfg,
        action: hasReferenceImages ? 'edit' : 'generate',
        async: true
      } as INanobananaGenerateRequest;
      let operation: Promise<unknown>;
      if (this.walletMode) {
        const wallet = this.getWalletContext();
        if (!wallet) {
          ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
          return;
        }
        operation = submitNanoWithX402(request, wallet, (quote) => this.confirmWalletPayment(quote));
      } else {
        if (!ensureLoggedIn()) return;
        const token = this.credential?.token;
        if (!token) {
          console.error('no token specified');
          return;
        }
        operation = nanobananaOperator.generate(request, { token });
      }

      ElMessage.info(this.$t('nanobanana.message.startingTask'));
      instrumentGeneration('nanobanana', operation)
        .then((response: any) => {
          if (this.walletMode && this.walletAddress && response?.taskId) {
            rememberWalletTask('nano-banana', this.walletAddress, response.taskId);
          }
          ElMessage.success(this.$t('nanobanana.message.startTaskSuccess'));
        })
        .catch((error) => {
          if (error instanceof ScenarioPaymentCancelledError) return;
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('nanobanana.message.usedUp'));
          } else if (this.walletMode) {
            ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
          } else {
            ElMessage.error(this.$t('nanobanana.message.startTaskFailed') + (response?.error?.message || ''));
          }
        })
        .finally(async () => {
          setTimeout(async () => {
            await this.onGetTasks();
            await this.onScrollDown();
          }, 1000);
        });
    },
    async onPaymentModeChange() {
      this.$store.commit('nanobanana/setTasks', undefined);
      await this.onGetTasks();
      await this.onScrollDown();
    },
    getWalletContext(): ScenarioWalletContext | undefined {
      const walletApi = (this as any).$wallet;
      const publicKey = walletApi?.publicKey?.value;
      const adapter = walletApi?.wallet?.value?.adapter;
      if (!publicKey || !adapter?.signTransaction) return undefined;
      return {
        publicKey,
        signTransaction: adapter.signTransaction.bind(adapter)
      };
    },
    async confirmWalletPayment(quote: ScenarioPaymentQuote): Promise<boolean> {
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
