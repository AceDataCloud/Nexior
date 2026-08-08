<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <model-selector class="mb-4" />
      <resolution-selector class="mb-4" />
      <prompt-input class="mb-4" />
      <image-urls-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="openaiimage" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('openaiimage.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import PromptInput from './config/PromptInput.vue';
import ImageUrlsInput from './config/ImageUrlsInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ModelSelector from './config/ModelSelector.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildOpenAIImageGenerateRequest } from '@/utils/x402/imageRequests';
import { openaiimageOperator } from '@/operators';

const QUOTE_DEBOUNCE_MS = 350;

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    Consumption,
    ImageUrlsInput,
    ModelSelector,
    ResolutionSelector,
    ScenarioPaymentMode
  },
  props: {
    identityToken: { type: String, default: undefined }
  },
  emits: ['generate'],
  data() {
    return {
      quoteTimer: 0,
      quoteRunId: 0
    };
  },
  computed: {
    config() {
      return this.$store.state.openaiimage?.config;
    },
    consumption() {
      const cfg: any = { ...(this.config || {}) };
      return getConsumption(
        {
          ...cfg
        },
        this.service?.cost
      );
    },
    service() {
      return this.$store.state.openaiimage?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('openaiimage').mode === 'wallet';
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
    },
    identityToken() {
      this.quoteRunId += 1;
      if (this.walletMode) this.scheduleQuote();
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
      const state = scenarioPaymentState('openaiimage');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await openaiimageOperator.quote(buildOpenAIImageGenerateRequest(this.config), this.identityToken);
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
