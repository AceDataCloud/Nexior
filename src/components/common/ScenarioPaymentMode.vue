<template>
  <div v-if="enabled && walletMode" class="scenario-wallet-price">
    <span v-if="state.quoteLoading">…</span>
    <span v-else-if="state.quoteUsdc" class="font-medium">{{ state.quoteUsdc }} USDC</span>
    <span v-else>{{ $t('common.x402Scenario.quoteBeforeSigning') }}</span>
    <el-alert
      v-if="paymentError"
      :type="paymentError.severity"
      :title="paymentError.title"
      :closable="false"
      show-icon
      role="alert"
      class="scenario-payment-error"
    >
      <template #default>
        <p>{{ paymentError.description }}</p>
        <p v-if="paymentError.safety" class="scenario-error-safety">{{ paymentError.safety }}</p>
        <p>{{ paymentError.nextStep }}</p>
        <code>{{ paymentError.technicalCode }}</code>
      </template>
    </el-alert>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert } from 'element-plus';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { resolveX402PaymentError, type X402ErrorPresentation } from '@/utils/x402/paymentError';
import { scenarioPaymentError } from '@/utils/x402/paymentErrorState';

export default defineComponent({
  name: 'ScenarioPaymentMode',
  components: { ElAlert },
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
    },
    paymentError(): X402ErrorPresentation | undefined {
      const error = scenarioPaymentError(this.scenario);
      if (!error) return undefined;
      return resolveX402PaymentError(error, this.$t.bind(this), 'request');
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

.scenario-payment-error {
  margin-top: 8px;
  text-align: left;
}

.scenario-payment-error p {
  margin: 0 0 6px;
}

.scenario-error-safety {
  color: var(--el-color-success);
  font-weight: 600;
}

.scenario-payment-error code {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
</style>
