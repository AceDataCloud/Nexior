<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <resolution-selector class="mb-4" />
      <duration-selector class="mb-4" />
      <image-input class="mb-4" />
      <reference-images-input v-if="supportsReferenceImages" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="grokvideo" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('grokvideo.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import PromptInput from './config/PromptInput.vue';
import ModelSelector from './config/ModelSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import ImageInput from './config/ImageInput.vue';
import ReferenceImagesInput from './config/ReferenceImagesInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildGrokVideoRequest, grokvideoOperator } from '@/operators/grokvideo';
import { isGrokVideoImageOnlyModel } from '@/constants';

export default defineComponent({
  name: 'GrokVideoConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    ModelSelector,
    DurationSelector,
    ResolutionSelector,
    RatioSelector,
    ImageInput,
    ReferenceImagesInput,
    Consumption,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    config() {
      return this.$store.state.grokvideo?.config;
    },
    // Most models accept reference images; grok-imagine-video-1.5:official is
    // image-to-video only (single input image).
    supportsReferenceImages(): boolean {
      return !isGrokVideoImageOnlyModel(this.$store.state.grokvideo?.config?.model);
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.grokvideo?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('grokvideo').mode === 'wallet';
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
      const state = scenarioPaymentState('grokvideo');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await grokvideoOperator.quote(buildGrokVideoRequest(this.config));
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
