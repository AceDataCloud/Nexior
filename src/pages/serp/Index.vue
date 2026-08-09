<template>
  <layout>
    <template #config>
      <search-panel @search="onSearch" />
    </template>
    <template #result>
      <result-panel @related-search="onRelatedSearch" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Serp.vue';
import SearchPanel from '@/components/serp/SearchPanel.vue';
import ResultPanel from '@/components/serp/ResultPanel.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import { ensureLoggedIn } from '@/utils';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';

export default defineComponent({
  name: 'SerpIndex',
  components: {
    Layout,
    SearchPanel,
    ResultPanel
  },
  inject: ['initialized'],
  computed: {
    credential() {
      return this.$store.state.serp?.credential;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('serp').mode === 'wallet';
    }
  },
  async mounted() {
    await this.onGetService();
  },
  methods: {
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('serp/getService');
      console.debug('end onGetService');
    },
    async onSearch() {
      const config = this.$store.state.serp?.config;
      if (!config?.query) return;
      let options;
      if (this.walletMode) {
        const wallet = this.getWalletContext();
        if (!wallet) {
          ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
          return;
        }
        options = {
          mode: 'x402',
          x402: {
            wallet,
            confirm: (quote: X402PaymentQuote) => this.confirmWalletPayment(quote),
            identityToken: this.credential?.token
          }
        };
      } else if (!ensureLoggedIn()) {
        return;
      }
      ElMessage.info(this.$t('serp.message.searching'));
      try {
        await this.$store.dispatch('serp/search', options);
        ElMessage.success(this.$t('serp.message.searchSuccess'));
      } catch (error: any) {
        if (error instanceof X402PaymentCancelledError) return;
        const response = error?.response?.data;
        if (response?.error?.code === ERROR_CODE_USED_UP) ElMessage.error(this.$t('serp.message.usedUp'));
        else if (this.walletMode) {
          ElMessage.error(`${this.$t('common.x402Scenario.paymentFailed')} ${error?.message || ''}`.trim());
        } else ElMessage.error(this.$t('serp.message.searchFailed'));
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
    async onRelatedSearch(query: string) {
      this.$store.commit('serp/setConfig', {
        ...this.$store.state.serp?.config,
        query
      });
      await this.onSearch();
    }
  }
});
</script>
