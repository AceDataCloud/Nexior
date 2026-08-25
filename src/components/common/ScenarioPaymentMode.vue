<template>
  <div v-if="enabled && walletMode" class="scenario-wallet-price">
    <div class="scenario-wallet-quote">
      <span v-if="state.quoteLoading">…</span>
      <span v-else-if="state.quoteUsdc" class="font-medium">{{ state.quoteUsdc }} USDC</span>
      <span v-else>{{ $t('common.x402Scenario.quoteBeforeSigning') }}</span>
    </div>
    <section v-if="paymentError" :class="['scenario-payment-error', `is-${paymentError.severity}`]" role="alert">
      <div class="scenario-error-icon" aria-hidden="true">
        <warning-icon v-if="paymentError.severity === 'warning'" :size="'1em' as any" focusable="false" />
        <error-icon v-else :size="'1em' as any" focusable="false" />
      </div>
      <div class="scenario-error-content">
        <h3 class="scenario-error-title">{{ paymentError.title }}</h3>
        <p class="scenario-error-description">{{ paymentError.description }}</p>
        <div v-if="paymentError.safety" class="scenario-error-safety">
          <success-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          <span>{{ paymentError.safety }}</span>
        </div>
        <p class="scenario-error-next-step">{{ paymentError.nextStep }}</p>
        <code class="scenario-error-code">{{ paymentError.technicalCode }}</code>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { ErrorIcon, SuccessIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { resolveX402PaymentError, type X402ErrorPresentation } from '@acedatacloud/core/x402';
import { scenarioPaymentError } from '@/utils/x402/paymentErrorState';

export default defineComponent({
  name: 'ScenarioPaymentMode',
  components: { ErrorIcon, SuccessIcon, WarningIcon },
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
  width: 100%;
  margin-bottom: 8px;
}

.scenario-wallet-quote {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}

.scenario-payment-error {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 10px;
  padding: 13px 14px 12px 12px;
  border: 1px solid var(--el-color-danger-light-7);
  border-left: 3px solid var(--el-color-danger);
  border-radius: 12px;
  background: var(--el-color-danger-light-9);
  color: var(--el-text-color-regular);
  text-align: left;
}

.scenario-payment-error.is-warning {
  border-color: var(--el-color-warning-light-7);
  border-left-color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

.scenario-error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: 50%;
  background: var(--el-color-danger);
  color: var(--el-color-white);
  font-size: 13px;
}

.is-warning .scenario-error-icon {
  background: var(--el-color-warning);
}

.scenario-error-content {
  min-width: 0;
}

.scenario-error-title {
  margin: 0;
  color: var(--el-color-danger);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
}

.is-warning .scenario-error-title {
  color: var(--el-color-warning-dark-2);
}

.scenario-error-description,
.scenario-error-next-step {
  margin: 5px 0 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
}

.scenario-error-next-step {
  font-weight: 500;
}

.scenario-error-safety {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  margin-top: 8px;
  padding: 3px 8px;
  border: 1px solid var(--el-color-success-light-7);
  border-radius: 999px;
  background: var(--el-color-success-light-9);
  color: var(--el-color-success-dark-2);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.scenario-error-code {
  display: block;
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: transparent;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family);
  font-size: 11px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

@media (max-width: 480px) {
  .scenario-payment-error {
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 9px;
    padding: 12px 12px 11px 10px;
  }

  .scenario-error-icon {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }

  .scenario-error-title {
    font-size: 15px;
  }
}
</style>
