<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <extend-from-input v-if="config?.video_id || config?.video_url" class="mb-4" />
      <prompt-input class="mb-4" />
      <custom-selector v-if="!config?.video_id" class="mb-4" />
      <upload-video v-if="config?.custom" class="mb-4" />
      <start-image-input v-if="!(config?.video_id || config?.video_url) && !config?.custom" class="mb-4" />
      <end-image-input class="mb-4" />
      <enhancement-selector class="mb-4" />
      <loop-selector class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="luma" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button
        v-if="config?.video_url !== undefined || config?.custom"
        type="primary"
        class="btn w-full"
        round
        @click="onGenerate"
      >
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('luma.button.extend') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('luma.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import EnhancementSelector from './config/EnhancementSelector.vue';
import CustomSelector from './config/CustomSelector.vue';
import LoopSelector from './config/LoopSelector.vue';
import EndImageInput from './config/EndImageInput.vue';
import StartImageInput from './config/StartImageInput.vue';
// @ts-ignore
import UploadVideo from './config/UploadVideo.vue';
import PromptInput from './config/PromptInput.vue';
import ExtendFromInput from './config/ExtendFromInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildLumaRequest, lumaOperator } from '@/operators/luma';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    MagicIcon,
    LoopSelector,
    StartImageInput,
    EndImageInput,
    EnhancementSelector,
    ElButton,
    PromptInput,
    ExtendFromInput,
    CustomSelector,
    UploadVideo,
    Consumption,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return { quoteTimer: 0, quoteRunId: 0 };
  },
  computed: {
    config() {
      return this.$store.state.luma?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.luma?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('luma').mode === 'wallet';
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
      const state = scenarioPaymentState('luma');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await lumaOperator.quote(buildLumaRequest(this.config));
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
