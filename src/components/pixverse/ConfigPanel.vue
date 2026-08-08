<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <style-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <motion-selector class="mb-4" />
      <quality-selector class="mb-4" />
      <start-image class="mb-4" />
      <seed-selector class="mb-4" />
      <duration-selector class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="pixverse" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('pixverse.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import ModelSelector from './config/ModelSelector.vue';
import QualitySelector from './config/QualitySelector.vue';
import MotionSelector from './config/MotionSelector.vue';
import StyleSelector from './config/StyleSelector.vue';
import SeedSelector from './config/SeedSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import StartImage from './config/StartImage.vue';
import PromptInput from './config/PromptInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildPixverseRequest, pixverseOperator } from '@/operators/pixverse';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    ModelSelector,
    QualitySelector,
    MotionSelector,
    StyleSelector,
    DurationSelector,
    StartImage,
    SeedSelector,
    RatioSelector,
    Consumption,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    config() {
      return this.$store.state.pixverse?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.pixverse?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('pixverse').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      handler(enabled: boolean) {
        if (enabled) this.scheduleQuote();
      },
      immediate: true
    },
    config: {
      handler() {
        if (this.walletMode) this.scheduleQuote();
      },
      deep: true
    }
  },
  beforeUnmount() {
    window.clearTimeout(this.quoteTimer);
    this.quoteRunId += 1;
  },
  methods: {
    scheduleQuote() {
      window.clearTimeout(this.quoteTimer);
      this.quoteTimer = window.setTimeout(this.refreshQuote, 350);
    },
    async refreshQuote() {
      const state = scenarioPaymentState('pixverse');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await pixverseOperator.quote(buildPixverseRequest(this.config));
        if (runId === this.quoteRunId && state.mode === 'wallet') state.quoteUsdc = quote.amountUsdc;
      } catch (error) {
        console.warn('x402 quote failed', error);
      } finally {
        if (runId === this.quoteRunId) state.quoteLoading = false;
      }
    },
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
