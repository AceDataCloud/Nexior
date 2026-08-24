<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <resolution-selector v-if="supportsResolution" class="mb-4" />
      <duration-selector v-if="supportsDuration" class="mb-4" />
      <image-url-input v-if="supportsImageUrl" class="mb-4" />
      <media-input v-if="isWan3" class="mb-4" />
      <wan3-options v-if="isWan3" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="wan" />
      <service-pricing-summary v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('wan.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import ModelSelector from './config/ModelSelector.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import PromptInput from './config/PromptInput.vue';
import MediaInput from './config/MediaInput.vue';
import Wan3Options from './config/Wan3Options.vue';
import ServicePricingSummary from '../common/ServicePricingSummary.vue';
import { getConsumption } from '@/utils';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildWanRequest, wanOperator } from '@/operators/wan';
import { canSubmitGeneration } from '@/utils/generationInput';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    ImageUrlInput,
    ModelSelector,
    ResolutionSelector,
    DurationSelector,
    MediaInput,
    Wan3Options,
    ServicePricingSummary,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    canGenerate(): boolean {
      return canSubmitGeneration('wan', buildWanRequest(this.config));
    },
    config() {
      return this.$store.state.wan?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.wan?.service;
    },
    supportsResolution() {
      const model = this.config?.model;
      return (
        model === 'wan2.6-t2v' || model === 'wan2.6-i2v' || model === 'wan2.6-i2v-flash' || model === 'wan3.0-video'
      );
    },
    supportsDuration() {
      return this.config?.model === 'wan2.6-t2v';
    },
    isWan3() {
      return this.config?.model === 'wan3.0-video';
    },
    supportsImageUrl() {
      const model = this.config?.model;
      return model === 'wan2.6-i2v' || model === 'wan2.6-i2v-flash';
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('wan').mode === 'wallet';
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
      this.quoteRunId += 1;
      const state = scenarioPaymentState('wan');
      state.quoteUsdc = undefined;
      state.quoteLoading = false;
      if (!this.canGenerate) return;
      this.quoteTimer = window.setTimeout(this.refreshQuote, 350);
    },
    async refreshQuote() {
      if (!this.canGenerate) return;
      const state = scenarioPaymentState('wan');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await wanOperator.quote(buildWanRequest(this.config));
        if (runId === this.quoteRunId && state.mode === 'wallet' && this.canGenerate)
          state.quoteUsdc = quote.amountUsdc;
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
