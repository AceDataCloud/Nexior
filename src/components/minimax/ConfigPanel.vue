<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-4">
        <field-title :title="$t('minimax.name.model')" :description="$t('minimax.description.model')" />
        <el-input model-value="MiniMax-H3" disabled />
      </div>
      <prompt-textarea
        v-model="form.prompt"
        class="mb-4"
        :title="$t('minimax.name.prompt')"
        :info="$t('minimax.description.prompt')"
        :placeholder="$t('minimax.placeholder.prompt')"
        :min-rows="4"
      />
      <reference-media-input
        v-model="form.imageUrls"
        class="mb-4"
        kind="image"
        :title="$t('minimax.name.referenceImages')"
        :description="$t('minimax.description.referenceImages')"
        :limit="9"
      />
      <reference-media-input
        v-model="form.audioUrls"
        class="mb-4"
        kind="audio"
        :title="$t('minimax.name.referenceAudios')"
        :description="$t('minimax.description.referenceAudios')"
        :limit="3"
      />
      <div class="mb-4">
        <field-title :title="$t('minimax.name.resolution')" :description="$t('minimax.description.resolution')" />
        <div class="option-grid">
          <button
            v-for="resolution in resolutions"
            :key="resolution"
            type="button"
            class="option-button"
            :class="{ active: form.resolution === resolution }"
            :aria-pressed="form.resolution === resolution"
            @click="form.resolution = resolution"
          >
            {{ resolution }}
          </button>
        </div>
      </div>
      <div class="mb-4">
        <field-title :title="$t('minimax.name.ratio')" :description="$t('minimax.description.ratio')" />
        <div class="ratio-options">
          <button
            v-for="ratio in ratios"
            :key="ratio.value"
            type="button"
            class="ratio-button"
            :class="{ active: form.ratio === ratio.value }"
            :aria-pressed="form.ratio === ratio.value"
            @click="form.ratio = ratio.value"
          >
            <span class="ratio-preview">
              <span :style="{ width: ratio.width, height: ratio.height }" aria-hidden="true" />
            </span>
            <span>{{ ratio.value }}</span>
          </button>
        </div>
      </div>
      <div class="setting-row mb-4">
        <field-title inline :title="$t('minimax.name.duration')" :description="$t('minimax.description.duration')" />
        <el-select v-model="form.duration" class="setting-value">
          <el-option v-for="duration in durations" :key="duration" :label="`${duration}s`" :value="duration" />
        </el-select>
      </div>
      <div class="setting-row">
        <field-title inline :title="$t('minimax.name.watermark')" :description="$t('minimax.description.watermark')" />
        <el-switch v-model="form.aigcWatermark" />
      </div>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="minimax" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('minimax.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElInput, ElMessage, ElOption, ElSelect, ElSwitch } from 'element-plus';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import FieldTitle from './config/FieldTitle.vue';
import ReferenceMediaInput from './config/ReferenceMediaInput.vue';
import Consumption from '../common/Consumption.vue';
import { IMinimaxConfig, IMinimaxContentItem, IMinimaxRatio } from '@/models';
import { getConsumption } from '@/utils';
import { validateMinimaxConfig } from '@/utils/minimax';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildMinimaxRequest, minimaxOperator } from '@/operators/minimax';

export default defineComponent({
  name: 'MinimaxConfigPanel',
  components: {
    MagicIcon,
    Consumption,
    ElButton,
    ElInput,
    ElOption,
    ElSelect,
    ElSwitch,
    FieldTitle,
    PromptTextarea,
    ReferenceMediaInput,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return {
      form: {
        prompt: '',
        imageUrls: [] as string[],
        audioUrls: [] as string[],
        resolution: '2K' as '768P' | '2K',
        ratio: '16:9' as IMinimaxRatio,
        duration: 4,
        aigcWatermark: false
      },
      resolutions: ['768P', '2K'] as const,
      ratios: [
        { value: 'adaptive' as const, width: '21px', height: '21px' },
        { value: '21:9' as const, width: '28px', height: '12px' },
        { value: '16:9' as const, width: '25px', height: '13px' },
        { value: '4:3' as const, width: '22px', height: '17px' },
        { value: '1:1' as const, width: '19px', height: '19px' },
        { value: '3:4' as const, width: '17px', height: '22px' },
        { value: '9:16' as const, width: '13px', height: '25px' }
      ],
      durations: Array.from({ length: 12 }, (_, index) => index + 4),
      quoteTimer: 0,
      quoteRunId: 0
    };
  },
  computed: {
    config(): IMinimaxConfig {
      const content: IMinimaxContentItem[] = [];
      const prompt = this.form.prompt.trim();
      if (prompt) content.push({ type: 'text', text: prompt });
      const referenceMode = this.form.imageUrls.length > 1 || this.form.audioUrls.length > 0;
      this.form.imageUrls.forEach((url) => {
        content.push({
          type: 'image_url',
          image_url: { url },
          role: referenceMode ? 'reference_image' : 'first_frame'
        });
      });
      this.form.audioUrls.forEach((url) => {
        content.push({ type: 'audio_url', audio_url: { url }, role: 'reference_audio' });
      });
      return {
        model: 'MiniMax-H3',
        content,
        resolution: this.form.resolution,
        ratio: this.form.imageUrls.length === 1 && !this.form.audioUrls.length ? 'adaptive' : this.form.ratio,
        duration: this.form.duration,
        aigc_watermark: this.form.aigcWatermark
      };
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.minimax?.service;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('minimax').mode === 'wallet';
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
      handler(value: IMinimaxConfig) {
        this.$store.commit('minimax/setConfig', value);
        if (this.walletMode) this.scheduleQuote();
      },
      deep: true,
      immediate: true
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
      const state = scenarioPaymentState('minimax');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await minimaxOperator.quote(buildMinimaxRequest(this.config));
        if (runId === this.quoteRunId && state.mode === 'wallet') state.quoteUsdc = quote.amountUsdc;
      } catch (error) {
        console.warn('x402 quote failed', error);
      } finally {
        if (runId === this.quoteRunId) state.quoteLoading = false;
      }
    },
    onGenerate() {
      const error = validateMinimaxConfig(this.config);
      if (error) {
        ElMessage.warning(this.$t(`minimax.message.${error}`));
        return;
      }
      this.$emit('generate');
    }
  }
});
</script>

<style scoped>
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.option-button {
  min-height: 36px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.option-button:hover,
.ratio-button:hover {
  border-color: var(--el-border-color-hover);
  background: var(--el-fill-color);
}

.option-button.active,
.ratio-button.active {
  color: var(--el-color-primary);
  font-weight: 600;
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.ratio-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ratio-button {
  display: flex;
  width: 48px;
  height: 65px;
  padding: 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: var(--el-text-color-primary);
  font-size: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-lighter);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.ratio-preview {
  display: flex;
  width: 30px;
  height: 30px;
  margin-top: 5px;
  margin-bottom: 3px;
  align-items: center;
  justify-content: center;
}

.ratio-preview > span {
  display: block;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 2px;
}

.ratio-button.active .ratio-preview > span {
  border-color: var(--el-color-primary);
}

.setting-row {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-value {
  width: 120px;
}
</style>
