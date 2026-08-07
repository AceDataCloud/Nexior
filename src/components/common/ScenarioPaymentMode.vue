<template>
  <div v-if="enabled && walletMode" class="scenario-wallet-price">
    <span v-if="state.quoteLoading">…</span>
    <span v-else-if="state.quoteUsdc" class="font-medium">{{ state.quoteUsdc }} USDC</span>
    <span v-else>{{ $t('common.x402Scenario.quoteBeforeSigning') }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';

export default defineComponent({
  name: 'ScenarioPaymentMode',
  props: {
    scenario: { type: String, required: true }
  },
  computed: {
    enabled(): boolean {
      return isScenarioX402Enabled();
    },
    state() {
      return scenarioPaymentState(this.scenario);
    },
    walletMode(): boolean {
      return this.state.mode === 'wallet';
    }
  }
});
</script>

<style scoped>
.scenario-wallet-price {
  margin-bottom: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}
</style>
