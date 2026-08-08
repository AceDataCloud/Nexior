<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <resolution-selector class="mb-4" />
      <duration-selector class="mb-4" />
      <generate-audio-switch class="mb-4" />
      <camera-fixed-switch class="mb-4" />
      <return-last-frame-switch class="mb-4" />
      <seed-input class="mb-4" />
      <first-frame-image class="mb-4" />
      <last-frame-image class="mb-4" />
      <reference-image class="mb-4" />
      <reference-audio class="mb-4" />
      <reference-video class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="seedance" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('seedance.button.generate') }}
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
import GenerateAudioSwitch from './config/GenerateAudioSwitch.vue';
import CameraFixedSwitch from './config/CameraFixedSwitch.vue';
import FirstFrameImage from './config/FirstFrameImage.vue';
import LastFrameImage from './config/LastFrameImage.vue';
import ReferenceImage from './config/ReferenceImage.vue';
import ReferenceAudio from './config/ReferenceAudio.vue';
import ReferenceVideo from './config/ReferenceVideo.vue';
import ReturnLastFrameSwitch from './config/ReturnLastFrameSwitch.vue';
import SeedInput from './config/SeedInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import { normalizeSeedanceRequest } from '@/utils/seedance';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { seedanceOperator } from '@/operators/seedance';

export default defineComponent({
  name: 'SeedanceConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    PromptInput,
    ModelSelector,
    DurationSelector,
    ResolutionSelector,
    RatioSelector,
    GenerateAudioSwitch,
    CameraFixedSwitch,
    ReturnLastFrameSwitch,
    SeedInput,
    FirstFrameImage,
    LastFrameImage,
    ReferenceImage,
    ReferenceAudio,
    ReferenceVideo,
    Consumption,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    config() {
      return this.$store.state.seedance?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.seedance?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('seedance').mode === 'wallet';
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
      const state = scenarioPaymentState('seedance');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      const { request } = normalizeSeedanceRequest(this.config);
      try {
        if (!request) return;
        const quote = await seedanceOperator.quote(request);
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
