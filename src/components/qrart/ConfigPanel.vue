<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <type-selector class="mb-4" />
      <content-input class="mb-4" />
      <prompt-input class="mb-4" />
      <aspect-ratio-selector class="mb-4" />
      <qrw-selector class="mb-4" />
      <preset-selector class="mb-4" />
      <position-selector class="mb-4" />
      <advanced-selector class="mb-4" />
      <steps-selector v-if="config?.advanced" class="mb-4" />
      <seed-input v-if="config?.advanced" class="mb-4" />
      <pixel-style-selector v-if="config?.advanced" class="mb-4" />
      <marker-shape-selector v-if="config?.advanced" class="mb-4" />
      <sub-marker-selector v-if="config?.advanced" class="mb-4" />
      <rotate-selector v-if="config?.advanced" class="mb-4" />
      <ecl-selector v-if="config?.advanced" class="mb-4" />
      <padding-level-selector v-if="config?.advanced" class="mb-4" />
      <padding-noise-selector v-if="config?.advanced" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="qrart" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="$emit('generate')">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('qrart.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import TypeSelector from './config/TypeSelector.vue';
import AspectRatioSelector from './config/AspectRatioSelector.vue';
import QrwSelector from './config/QrwSelector.vue';
import StepsSelector from './config/StepsSelector.vue';
import AdvancedSelector from './config/AdvancedSelector.vue';
import MarkerShapeSelector from './config/MarkerShapeSelector.vue';
import SubMarkerSelector from './config/SubMarkerSelector.vue';
import RotateSelector from './config/RotateSelector.vue';
import EclSelector from './config/EclSelector.vue';
import PositionSelector from './config/PositionSelector.vue';
import PaddingLevelSelector from './config/PaddingLevelSelector.vue';
import PaddingNoiseSelector from './config/PaddingNoiseSelector.vue';
import PixelStyleSelector from './config/PixelStyleSelector.vue';
import SeedInput from './config/SeedInput.vue';
import PresetSelector from './config/PresetSelector2.vue';
import ContentInput from './config/ContentInput.vue';
import PromptInput from './config/PromptInput.vue';
import { ElButton } from 'element-plus';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildQrartRequest, qrartOperator } from '@/operators/qrart';

const QUOTE_DEBOUNCE_MS = 350;

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    Consumption,
    TypeSelector,
    PositionSelector,
    PixelStyleSelector,
    PaddingLevelSelector,
    SeedInput,
    AspectRatioSelector,
    QrwSelector,
    EclSelector,
    StepsSelector,
    PaddingNoiseSelector,
    AdvancedSelector,
    MarkerShapeSelector,
    SubMarkerSelector,
    RotateSelector,
    PresetSelector,
    ContentInput,
    PromptInput,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    config() {
      return this.$store.state.qrart?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.qrart?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('qrart').mode === 'wallet';
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
      const state = scenarioPaymentState('qrart');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await qrartOperator.quote(buildQrartRequest(this.config));
        if (runId === this.quoteRunId && state.mode === 'wallet') state.quoteUsdc = quote.amountUsdc;
      } catch (error) {
        console.warn('x402 quote failed', error);
      } finally {
        if (runId === this.quoteRunId) state.quoteLoading = false;
      }
    }
  }
});
</script>
