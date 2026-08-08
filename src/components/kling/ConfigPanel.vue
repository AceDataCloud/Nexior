<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" @open-inspiration="inspirationOpen = true" />
      <model-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <reference-images v-if="capabilities.referenceImages" class="mb-3" />
      <reference-video v-if="capabilities.referenceVideo" class="mb-4" />
      <start-image class="mb-4" />
      <end-image class="mb-4" />
      <duration-selector class="mb-4" />
      <mode-selector class="mb-4" />
      <generate-audio-selector class="mb-4" />
      <camera-control-selector v-if="!omniActive" class="mb-4" />
      <cfg-scale-selector v-if="!omniActive" class="mb-4" />
      <negative-prompt-input v-if="!omniActive" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <summary-chip />
      <scenario-payment-mode scenario="kling" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button
        v-if="config?.video_url !== undefined || config?.custom"
        type="primary"
        class="btn w-full"
        round
        @click="onGenerate"
      >
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('kling.button.extend') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('kling.button.generate') }}
      </el-button>
    </div>
    <inspiration-drawer v-model="inspirationOpen" />
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import ModelSelector from './config/ModelSelector.vue';
import ModeSelector from './config/ModeSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import StartImage from './config/StartImage.vue';
import EndImage from './config/EndImage.vue';
import ReferenceVideo from './config/ReferenceVideo.vue';
import ReferenceImages from './config/ReferenceImages.vue';
import Consumption from '../common/Consumption.vue';
import CfgScaleSelector from './config/CfgScaleSelector.vue';
import GenerateAudioSelector from './config/GenerateAudioSelector.vue';
import CameraControlSelector from './config/CameraControlSelector.vue';
import PromptInput from './config/PromptInput.vue';
import NegativePromptInput from './config/NegativePromptInput.vue';
import InspirationDrawer from './inspiration/InspirationDrawer.vue';
import SummaryChip from './SummaryChip.vue';
import { getConsumption } from '@/utils';
import { getKlingCapabilities } from '@/utils/kling/capabilities';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildKlingVideoRequest, klingOperator } from '@/operators/kling';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    Consumption,
    PromptInput,
    NegativePromptInput,
    ModelSelector,
    ModeSelector,
    DurationSelector,
    RatioSelector,
    StartImage,
    CfgScaleSelector,
    GenerateAudioSelector,
    CameraControlSelector,
    InspirationDrawer,
    SummaryChip,
    EndImage,
    ReferenceImages,
    ReferenceVideo,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return {
      inspirationOpen: false,
      quoteTimer: 0,
      quoteRunId: 0
    };
  },
  computed: {
    config() {
      return this.$store.state.kling?.config;
    },
    capabilities() {
      return getKlingCapabilities(this.config?.model, this.config?.mode, this.config?.duration);
    },
    omniActive(): boolean {
      return (
        this.config?.model === 'kling-o1' || Boolean(this.config?.image_list?.length || this.config?.video_list?.length)
      );
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.kling?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('kling').mode === 'wallet';
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
      const state = scenarioPaymentState('kling');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await klingOperator.quote(buildKlingVideoRequest(this.config));
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
