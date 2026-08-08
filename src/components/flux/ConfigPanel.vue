<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <action-selector class="mb-4" />
      <prompt-input class="mb-4" />
      <image-url-input v-if="config?.action === 'edits'" class="mb-4" />
      <model-selector class="mb-4" />
      <size-selector class="mb-4" />
      <count-selector class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="flux" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('flux.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import ModelSelector from './config/ModelSelector.vue';
import CountSelector from './config/CountSelector.vue';
import ActionSelector from './config/ActionSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import PromptInput from './config/PromptInput.vue';
import SizeSelector from './config/SizeSelector.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildFluxRequest, fluxOperator } from '@/operators/flux';

const QUOTE_DEBOUNCE_MS = 350;

export default defineComponent({
  name: 'PresetPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    ModelSelector,
    CountSelector,
    Consumption,
    ActionSelector,
    ImageUrlInput,
    SizeSelector,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    config() {
      return this.$store.state.flux?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.flux?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('flux').mode === 'wallet';
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
      this.quoteTimer = window.setTimeout(this.refreshQuote, QUOTE_DEBOUNCE_MS);
    },
    async refreshQuote() {
      const state = scenarioPaymentState('flux');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await fluxOperator.quote(buildFluxRequest(this.config));
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
