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
import Layout from '@/layouts/OpenAIImage.vue';
import ConfigPanel from '@/components/openaiimage/ConfigPanel.vue';
import { openaiimageOperator } from '@/operators';
import { instrumentGeneration } from '@/plugins/telemetry';
import { IOpenAIImageEditRequest, IOpenAIImageGenerateRequest, Status } from '@/models';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/openaiimage/RecentPanel.vue';
import { loadPreviousPage } from '@/utils/pagination';
import { uploadTrackerProviderMixin, ensureNoPendingUpload, ensureLoggedIn } from '@/utils';
import { IOpenAIImageTask } from '@/models';
import { mergeAndSortLists } from '@/utils/merge';
import { isScenarioX402Enabled, scenarioPaymentMode } from '@/utils/x402/scenarioPayment';
import {
  listWalletTasks,
  rememberWalletTask,
  ScenarioPaymentCancelledError,
  submitOpenAIImageWithX402,
  walletTaskIds,
  type ScenarioPaymentQuote,
  type ScenarioWalletContext
} from '@/utils/x402/scenarioClient';

interface IData {
  task: IOpenAIImageTask | undefined;
  job: number;
  loading: boolean;
}

export default defineComponent({
  name: 'OpenAIImageIndex',
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
      return this.$store.state.openaiimage?.status?.getApplications === Status.Request;
    },
    tasksLoading() {
      return this.$store.state.openaiimage?.status?.getTasks === Status.Request;
    },
    credential() {
      return this.$store.state.openaiimage?.credential;
    },
    config() {
      return this.$store.state.openaiimage?.config;
    },
    application() {
      return this.$store.state.openaiimage?.application;
    },
    tasks() {
      return this.$store.state.openaiimage?.tasks;
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
      await this.$store.dispatch('openaiimage/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('openaiimage/getApplications');
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
        const response = await listWalletTasks<IOpenAIImageTask>(
          'openai',
          walletTaskIds('openai', this.walletAddress),
          {
            limit,
            createdAtMin,
            createdAtMax
          }
        );
        const existing = this.tasks?.items || [];
        this.$store.commit('openaiimage/setTasksItems', mergeAndSortLists(existing, response.items));
        this.$store.commit('openaiimage/setTasksTotal', response.count);
        return;
      }
      await this.$store.dispatch('openaiimage/getTasks', {
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

      if (!this.hasText(cfg.prompt)) {
        ElMessage.error(this.$t('openaiimage.message.promptRequired'));
        return;
      }
      cfg.prompt = cfg.prompt.trim();

      if (!hasReferenceImages && 'image_urls' in cfg) {
        delete cfg.image_urls;
      }
      if (!cfg.size) {
        delete cfg.size;
      }

      const generateRequest = {
        ...cfg,
        action: 'generate',
        async: true
      } as IOpenAIImageGenerateRequest;

      const editRequest = {
        action: 'edit',
        model: cfg?.model,
        prompt: cfg?.prompt,
        size: cfg?.size,
        image_urls: cfg?.image_urls || [],
        async: true
      } as IOpenAIImageEditRequest;

      let operation: Promise<unknown>;
      if (this.walletMode) {
        if (hasReferenceImages) {
          ElMessage.info(this.$t('common.x402Scenario.gptEditCreditsOnly'));
          return;
        }
        const wallet = this.getWalletContext();
        if (!wallet) {
          ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
          return;
        }
        operation = submitOpenAIImageWithX402(generateRequest, wallet, (quote) => this.confirmWalletPayment(quote));
      } else {
        if (!ensureLoggedIn()) return;
        const token = this.credential?.token;
        if (!token) {
          console.error('no token specified');
          return;
        }
        operation = hasReferenceImages
          ? openaiimageOperator.edit(editRequest, { token })
          : openaiimageOperator.generate(generateRequest, { token });
      }

      ElMessage.info(this.$t('openaiimage.message.startingTask'));
      instrumentGeneration('openaiimage', operation)
        .then((response: any) => {
          console.debug('task accepted', response?.data?.task_id || response?.taskId);
          if (this.walletMode && this.walletAddress && response?.taskId) {
            rememberWalletTask('openai', this.walletAddress, response.taskId);
          }
          ElMessage.success(this.$t('openaiimage.message.startTaskSuccess'));
        })
        .catch((error) => {
          if (error instanceof ScenarioPaymentCancelledError) return;
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('openaiimage.message.usedUp'));
          } else if (this.walletMode) {
            ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
          } else {
            ElMessage.error(this.$t('openaiimage.message.startTaskFailed') + (response?.error?.message || ''));
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
      this.$store.commit('openaiimage/setTasks', undefined);
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
    },
    hasText(value: unknown): value is string {
      return typeof value === 'string' && value.trim().length > 0;
    }
  }
});
</script>
