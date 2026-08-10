<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Remix banner: iterating on a previous video -->
      <el-alert v-if="isRemixing" :closable="false" type="info" class="mb-5">
        <p class="text-xs mb-1">
          <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('maestro.name.remixing') }}: {{ refTaskId }}
        </p>
        <el-button size="small" text @click="onClearRemix">{{ $t('maestro.button.cancelRemix') }}</el-button>
      </el-alert>

      <!-- Prompt -->
      <prompt-textarea
        v-model="prompt"
        class="mb-5"
        :title="$t('maestro.name.prompt')"
        :info="$t('maestro.description.prompt')"
        :placeholder="$t('maestro.placeholder.prompt')"
        :min-rows="6"
      />

      <!-- Reference files -->
      <div class="field-block mb-5">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('maestro.name.files') }}</h2>
          <info-icon :content="$t('maestro.description.files')" class="ml-1" />
        </div>
        <file-urls-input />
      </div>

      <!-- Languages -->
      <div class="field-block mb-5">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('maestro.name.langs') }}</h2>
          <info-icon :content="$t('maestro.description.langs')" class="ml-1" />
        </div>
        <div class="language-picker">
          <label class="language-role language-role--primary">
            <span class="language-role-label">{{ $t('maestro.name.primaryLanguage') }}</span>
            <el-select v-model="primaryLanguage" class="w-full">
              <el-option
                v-for="option in languageOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>
          <label class="language-role">
            <span class="language-role-label">{{ $t('maestro.name.additionalLanguages') }}</span>
            <el-select
              v-model="additionalLanguages"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :multiple-limit="additionalLanguageLimit"
              :placeholder="$t('maestro.placeholder.additionalLanguages')"
              class="w-full"
            >
              <el-option
                v-for="option in additionalLanguageOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>
        </div>
      </div>

      <!-- Aspect ratio -->
      <div class="field-block mb-5">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('maestro.name.aspect') }}</h2>
        </div>
        <div class="ratio-items" role="radiogroup" :aria-label="$t('maestro.name.aspect')">
          <div
            v-for="opt in ratioOptions"
            :key="opt.value"
            class="ratio-item"
            :class="{ active: aspect === opt.value }"
            role="radio"
            :aria-checked="aspect === opt.value"
            :aria-label="opt.value"
            tabindex="0"
            @click="aspect = opt.value"
            @keydown.enter.prevent="aspect = opt.value"
            @keydown.space.prevent="aspect = opt.value"
          >
            <div class="ratio-preview">
              <div class="ratio-rect" :style="{ width: opt.width + 'px', height: opt.height + 'px' }"></div>
            </div>
            <p class="ratio-name">{{ opt.value }}</p>
          </div>
        </div>
      </div>

      <!-- Duration -->
      <div class="field-row mb-4">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('maestro.name.duration') }}</h2>
          <info-icon :content="$t('maestro.description.duration')" class="ml-1" />
        </div>
        <el-input-number
          v-model="duration"
          class="field-control"
          :min="MAESTRO_MIN_DURATION"
          :max="activeSkuPolicy.maxDuration"
          :step="5"
          controls-position="right"
        />
      </div>

      <!-- SKU -->
      <div class="field-block sku-field">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('maestro.name.quality') }}</h2>
          <info-icon :content="$t('maestro.description.quality')" class="ml-1" />
        </div>
        <div class="sku-cards" role="radiogroup" :aria-label="$t('maestro.name.quality')">
          <button
            v-for="sku in MAESTRO_ALLOWED_QUALITIES"
            :key="sku"
            type="button"
            class="sku-card"
            :class="{ active: quality === sku }"
            role="radio"
            :aria-checked="quality === sku"
            @click="quality = sku"
          >
            <span class="sku-card-name">{{ $t(`maestro.option.quality.${sku}`) }}</span>
            <strong class="sku-card-price">{{ MAESTRO_SKU_POLICIES[sku].rate }} Cr/s</strong>
            <span class="sku-card-meta">
              {{ MAESTRO_SKU_POLICIES[sku].resolution }} · {{ MAESTRO_SKU_POLICIES[sku].fps }} fps ·
              {{ $t('maestro.name.upToSeconds', { seconds: MAESTRO_SKU_POLICIES[sku].maxDuration }) }}
            </span>
          </button>
        </div>
        <div class="sku-summary">
          <span>{{ $t(`maestro.description.quality.${quality}`) }}</span>
          <strong>{{ $t('maestro.name.estimatedCredits', { credits: estimatedCredits }) }}</strong>
        </div>
      </div>

      <!-- Scenario (video type) -->
      <div class="custom-field">
        <div class="custom-field-header mb-2">
          <div class="field-head">
            <h2 class="field-title font-bold">{{ $t('maestro.name.customizeScenario') }}</h2>
            <info-icon :content="$t('maestro.description.scenario')" class="ml-1" />
          </div>
          <el-switch v-model="scenarioCustomizationEnabled" :aria-label="$t('maestro.name.customizeScenario')" />
        </div>
        <div
          class="scenario-cards"
          :class="{ 'is-disabled': !scenarioCustomizationEnabled }"
          role="radiogroup"
          :aria-label="$t('maestro.name.scenario')"
          :aria-disabled="!scenarioCustomizationEnabled"
        >
          <div
            v-for="s in MAESTRO_ALLOWED_SCENARIOS"
            :key="s"
            class="scenario-card"
            :class="{
              active: scenarioCustomizationEnabled && scenario === s,
              disabled: !scenarioCustomizationEnabled || !isScenarioAvailable(s)
            }"
            role="radio"
            :aria-checked="scenarioCustomizationEnabled && scenario === s"
            :aria-disabled="!scenarioCustomizationEnabled || !isScenarioAvailable(s)"
            :aria-label="$t(`maestro.option.scenario.${s}`)"
            :tabindex="scenarioCustomizationEnabled && isScenarioAvailable(s) ? 0 : -1"
            @click="scenarioCustomizationEnabled && isScenarioAvailable(s) && (scenario = s)"
            @keydown.enter.prevent="scenarioCustomizationEnabled && isScenarioAvailable(s) && (scenario = s)"
            @keydown.space.prevent="scenarioCustomizationEnabled && isScenarioAvailable(s) && (scenario = s)"
          >
            <div class="scenario-thumb">
              <img :src="MAESTRO_SCENARIO_THUMBNAILS[s]" :alt="$t(`maestro.option.scenario.${s}`)" loading="lazy" />
            </div>
            <p class="scenario-name">{{ $t(`maestro.option.scenario.${s}`) }}</p>
            <span v-if="!isScenarioAvailable(s)" class="scenario-lock">
              {{ $t('maestro.name.requiresSku', { sku: requiredSkuForScenario(s) }) }}
            </span>
          </div>
        </div>
        <el-alert
          v-if="needsRequiredUpload"
          :title="$t(scenario === 'avatar' ? 'maestro.message.avatarNeedsImage' : 'maestro.message.captionsNeedVideo')"
          type="warning"
          :closable="false"
          show-icon
          class="mt-2"
        />
      </div>

      <!-- Style (visual direction) -->
      <div class="custom-field">
        <div class="custom-field-header mb-2">
          <div class="field-head">
            <h2 class="field-title font-bold">{{ $t('maestro.name.customizeStyle') }}</h2>
            <info-icon :content="$t('maestro.description.style')" class="ml-1" />
          </div>
          <el-switch v-model="styleCustomizationEnabled" :aria-label="$t('maestro.name.customizeStyle')" />
        </div>
        <el-select
          v-model="style"
          class="w-full"
          filterable
          allow-create
          default-first-option
          :disabled="!styleCustomizationEnabled"
          :aria-label="$t('maestro.name.customizeStyle')"
          :placeholder="$t('maestro.placeholder.select')"
        >
          <el-option v-for="s in MAESTRO_ALLOWED_STYLES" :key="s" :label="$t(`maestro.option.style.${s}`)" :value="s" />
        </el-select>
      </div>

      <!-- Voice (narration timbre) + preview -->
      <div class="custom-field">
        <div class="custom-field-header mb-2">
          <div class="field-head">
            <h2 class="field-title font-bold">{{ $t('maestro.name.customizeVoice') }}</h2>
            <info-icon :content="$t('maestro.description.voice')" class="ml-1" />
          </div>
          <el-switch v-model="voiceCustomizationEnabled" :aria-label="$t('maestro.name.customizeVoice')" />
        </div>
        <div class="voice-row">
          <el-select
            v-model="voice"
            class="voice-select"
            :disabled="!voiceCustomizationEnabled"
            :aria-label="$t('maestro.name.customizeVoice')"
            :placeholder="$t('maestro.placeholder.select')"
          >
            <el-option
              v-for="v in MAESTRO_ALLOWED_VOICES"
              :key="v.key"
              :label="$t(`maestro.option.voice.${v.key}`)"
              :value="v.key"
            />
          </el-select>
          <el-button
            class="voice-play"
            :disabled="!voiceCustomizationEnabled || !currentSample"
            :title="$t('maestro.button.preview')"
            :aria-label="$t('maestro.button.preview')"
            @click="onToggleSample"
          >
            <pause-icon v-if="playing" :size="'1em' as any" aria-hidden="true" focusable="false" />
            <play-icon v-else :size="'1em' as any" aria-hidden="true" focusable="false" />
          </el-button>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <scenario-payment-mode scenario="maestro" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('maestro.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon, PauseIcon, PlayIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, markRaw } from 'vue';
import { ElButton, ElSelect, ElOption, ElInputNumber, ElAlert, ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import FileUrlsInput from './config/FileUrlsInput.vue';
import {
  MAESTRO_ALLOWED_ASPECTS,
  MAESTRO_MIN_DURATION,
  MAESTRO_DEFAULT_ACTION,
  MAESTRO_DEFAULT_LANGS,
  MAESTRO_DEFAULT_ASPECT,
  MAESTRO_DEFAULT_DURATION,
  MAESTRO_ALLOWED_QUALITIES,
  MAESTRO_SKU_POLICIES,
  type IMaestroSku,
  MAESTRO_ALLOWED_SCENARIOS,
  MAESTRO_SCENARIO_THUMBNAILS,
  MAESTRO_UPLOAD_REQUIRED_SCENARIOS,
  MAESTRO_ALLOWED_STYLES,
  MAESTRO_DEFAULT_STYLE,
  MAESTRO_ALLOWED_VOICES,
  MAESTRO_DEFAULT_VOICE
} from '@/constants';
import { IMaestroConfig } from '@/models';
import { isImageUrl, isVideoUrl } from '@/utils/is';
import {
  getMaestroLanguageOptions,
  normalizeMaestroLanguages,
  setMaestroAdditionalLanguages,
  setMaestroPrimaryLanguage,
  type IMaestroLanguageOption
} from '@/utils/maestroLanguages';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildMaestroRequest, maestroOperator } from '@/operators/maestro';
import {
  clampMaestroDuration,
  clampMaestroLanguages,
  estimateMaestroCredits,
  isMaestroScenarioAvailable,
  normalizeMaestroSku
} from '@/utils/maestroSku';

// Preview rectangle dimensions (px) for each aspect-ratio chip.
const RATIO_PREVIEW: Record<string, { width: number; height: number }> = {
  '9:16': { width: 15, height: 26 },
  '16:9': { width: 26, height: 15 },
  '1:1': { width: 20, height: 20 }
};

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    ElSelect,
    ElOption,
    ElInputNumber,
    ElAlert,
    ElSwitch,
    InfoIcon,
    PauseIcon,
    PlayIcon,
    PromptTextarea,
    FileUrlsInput,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data() {
    return {
      MAESTRO_MIN_DURATION,
      MAESTRO_ALLOWED_QUALITIES,
      MAESTRO_SKU_POLICIES,
      MAESTRO_ALLOWED_SCENARIOS,
      MAESTRO_SCENARIO_THUMBNAILS,
      MAESTRO_ALLOWED_STYLES,
      MAESTRO_ALLOWED_VOICES,
      playing: false,
      audioEl: null as HTMLAudioElement | null,
      quoteTimer: 0,
      quoteRunId: 0
    };
  },
  computed: {
    config(): IMaestroConfig | undefined {
      return this.$store.state.maestro?.config;
    },
    service() {
      return this.$store.state.maestro?.service;
    },
    ratioOptions(): { value: string; width: number; height: number }[] {
      return MAESTRO_ALLOWED_ASPECTS.map((value) => ({
        value,
        ...(RATIO_PREVIEW[value] ?? { width: 20, height: 20 })
      }));
    },
    isRemixing(): boolean {
      const action = this.config?.action;
      return !!action && action !== MAESTRO_DEFAULT_ACTION && !!this.config?.ref_task_id;
    },
    refTaskId(): string | undefined {
      return this.config?.ref_task_id;
    },
    needsRequiredUpload(): boolean {
      if (!this.scenarioCustomizationEnabled) return false;
      const scenario = this.config?.scenario;
      if (!scenario || !MAESTRO_UPLOAD_REQUIRED_SCENARIOS.includes(scenario)) return false;
      const urls = this.config?.file_urls || [];
      return scenario === 'captions' ? !urls.some((url) => isVideoUrl(url)) : !urls.some((url) => isImageUrl(url));
    },
    canGenerate(): boolean {
      return !!this.prompt?.trim() && !this.needsRequiredUpload;
    },
    prompt: {
      get(): string | undefined {
        return this.config?.prompt;
      },
      set(val: string) {
        this.update({ prompt: val });
      }
    },
    langs: {
      get(): string[] {
        return normalizeMaestroLanguages(this.config?.langs);
      },
      set(val: string[]) {
        this.update({ langs: normalizeMaestroLanguages(val) });
      }
    },
    languageOptions(): IMaestroLanguageOption[] {
      return getMaestroLanguageOptions(this.$i18n.locale);
    },
    additionalLanguageOptions(): IMaestroLanguageOption[] {
      return this.languageOptions.filter((option) => option.value !== this.primaryLanguage);
    },
    primaryLanguage: {
      get(): string {
        return this.langs[0] || MAESTRO_DEFAULT_LANGS[0];
      },
      set(val: string) {
        this.update({ langs: setMaestroPrimaryLanguage(this.langs, val) });
      }
    },
    additionalLanguages: {
      get(): string[] {
        return this.langs.slice(1);
      },
      set(val: string[]) {
        this.update({ langs: clampMaestroLanguages(setMaestroAdditionalLanguages(this.langs, val), this.quality) });
      }
    },
    activeSkuPolicy() {
      return MAESTRO_SKU_POLICIES[this.quality];
    },
    additionalLanguageLimit(): number {
      return Math.max(0, this.activeSkuPolicy.maxLanguages - 1);
    },
    estimatedCredits(): number {
      const scenario = this.scenarioCustomizationEnabled ? this.scenario || 'auto' : 'auto';
      return estimateMaestroCredits(
        this.duration || MAESTRO_DEFAULT_DURATION,
        this.quality,
        scenario,
        this.langs.length
      );
    },
    aspect: {
      get(): string | undefined {
        return this.config?.aspect;
      },
      set(val: string) {
        this.update({ aspect: val });
      }
    },
    duration: {
      get(): number | undefined {
        return this.config?.duration;
      },
      set(val: number) {
        // el-input-number can emit null when cleared; clamp into [min, max] with the default as fallback.
        this.update({ duration: clampMaestroDuration(val, this.quality) });
      }
    },
    quality: {
      get(): IMaestroSku {
        return normalizeMaestroSku(this.config?.quality);
      },
      set(val: IMaestroSku) {
        const patch: Partial<IMaestroConfig> = {
          quality: val,
          duration: clampMaestroDuration(this.duration, val),
          langs: clampMaestroLanguages(this.langs, val)
        };
        if (this.scenarioCustomizationEnabled && !isMaestroScenarioAvailable(this.scenario || 'auto', val)) {
          patch.scenario = 'narrated';
        }
        if (val === 'lite' && this.config?.action === 'remix') {
          patch.action = MAESTRO_DEFAULT_ACTION;
          patch.ref_task_id = undefined;
        }
        if (val !== 'pro' && this.config?.action === 'extend') {
          patch.action = MAESTRO_DEFAULT_ACTION;
          patch.ref_task_id = undefined;
        }
        this.update(patch);
      }
    },
    scenarioCustomizationEnabled: {
      get(): boolean {
        return this.config?.scenario_customization_enabled ?? false;
      },
      set(val: boolean) {
        this.update({ scenario_customization_enabled: val });
      }
    },
    styleCustomizationEnabled: {
      get(): boolean {
        return this.config?.style_customization_enabled ?? false;
      },
      set(val: boolean) {
        this.update({ style_customization_enabled: val });
      }
    },
    voiceCustomizationEnabled: {
      get(): boolean {
        return this.config?.voice_customization_enabled ?? false;
      },
      set(val: boolean) {
        if (!val) this.stopSample();
        this.update({ voice_customization_enabled: val });
      }
    },
    scenario: {
      get(): string | undefined {
        return this.config?.scenario;
      },
      set(val: string) {
        this.update({ scenario: val });
      }
    },
    style: {
      get(): string | undefined {
        return this.config?.style;
      },
      set(val: string) {
        const normalized = val?.trim();
        this.update({ style: !normalized || normalized.toLowerCase() === 'auto' ? MAESTRO_DEFAULT_STYLE : normalized });
      }
    },
    voice: {
      get(): string | undefined {
        return this.config?.voice;
      },
      set(val: string) {
        this.stopSample();
        this.update({ voice: val || MAESTRO_DEFAULT_VOICE });
      }
    },
    currentSample(): string | undefined {
      return MAESTRO_ALLOWED_VOICES.find((v) => v.key === this.voice)?.sample;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('maestro').mode === 'wallet';
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
    voiceCustomizationEnabled(enabled: boolean) {
      if (!enabled) this.stopSample();
    },
    voice() {
      this.stopSample();
    }
  },
  mounted() {
    const quality = normalizeMaestroSku(this.config?.quality);
    const langs = clampMaestroLanguages(normalizeMaestroLanguages(this.config?.langs), quality);
    const scenario = this.config?.scenario || 'narrated';
    this.update({
      action: this.config?.action ?? MAESTRO_DEFAULT_ACTION,
      langs,
      aspect: this.config?.aspect ?? MAESTRO_DEFAULT_ASPECT,
      duration: clampMaestroDuration(this.config?.duration, quality),
      quality,
      scenario: isMaestroScenarioAvailable(scenario, quality) ? scenario : 'narrated'
    });
  },
  beforeUnmount() {
    this.stopSample();
    window.clearTimeout(this.quoteTimer);
    this.quoteRunId += 1;
  },
  methods: {
    isScenarioAvailable(scenario: string): boolean {
      return isMaestroScenarioAvailable(scenario, this.quality);
    },
    requiredSkuForScenario(scenario: string): string {
      if (isMaestroScenarioAvailable(scenario, 'standard')) return 'Standard';
      return 'Pro';
    },
    scheduleQuote() {
      window.clearTimeout(this.quoteTimer);
      this.quoteTimer = window.setTimeout(this.refreshQuote, 350);
    },
    async refreshQuote() {
      const state = scenarioPaymentState('maestro');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const quote = await maestroOperator.quote(buildMaestroRequest(this.config));
        if (runId === this.quoteRunId && state.mode === 'wallet') state.quoteUsdc = quote.amountUsdc;
      } catch (error) {
        console.warn('x402 quote failed', error);
      } finally {
        if (runId === this.quoteRunId) state.quoteLoading = false;
      }
    },
    update(patch: Partial<IMaestroConfig>) {
      this.$store.commit('maestro/setConfig', {
        ...this.config,
        ...patch
      });
    },
    onClearRemix() {
      this.update({ action: MAESTRO_DEFAULT_ACTION, ref_task_id: undefined });
    },
    onToggleSample() {
      const src = this.currentSample;
      if (!src) return;
      if (!this.audioEl) {
        this.audioEl = markRaw(new Audio());
        this.audioEl.addEventListener('ended', () => {
          this.playing = false;
        });
      }
      if (this.playing) {
        this.audioEl.pause();
        this.playing = false;
        return;
      }
      if (this.audioEl.src !== src) this.audioEl.src = src;
      this.audioEl.currentTime = 0;
      this.audioEl
        .play()
        .then(() => {
          this.playing = true;
        })
        .catch(() => {
          this.playing = false;
        });
    },
    stopSample() {
      if (this.audioEl) {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      }
      this.playing = false;
    },
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>

<style lang="scss" scoped>
.field-head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.field-title {
  font-size: 14px;
  margin: 0;
}
.field-block > .field-head {
  margin-bottom: 8px;
}
.field-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.field-control {
  width: 168px;
}
.sku-field {
  margin-top: 20px;
}
.sku-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.sku-card {
  min-width: 0;
  padding: 10px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary-light-5);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
  }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    box-shadow: 0 0 0 1px var(--el-color-primary);
  }
}
.sku-card-name,
.sku-card-price,
.sku-card-meta {
  display: block;
}
.sku-card-name {
  font-size: 13px;
  font-weight: 700;
}
.sku-card-price {
  margin-top: 4px;
  color: var(--el-color-primary);
  font-size: 12px;
}
.sku-card-meta {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1.4;
}
.sku-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.45;

  strong {
    flex: 0 0 auto;
    color: var(--el-text-color-primary);
  }
}
.custom-field {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.custom-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.language-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.language-role {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.language-role-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}
.language-role--primary {
  .language-role-label {
    color: var(--el-color-primary);
  }

  :deep(.el-select__wrapper:not(.is-focused)) {
    box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
  }
}
.voice-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.voice-select {
  flex: 1;
}
.voice-play {
  flex: 0 0 auto;
}
.ratio-items {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
.ratio-item {
  width: 52px;
  height: 64px;
  border: 1px solid var(--el-border-color);
  background-color: var(--el-fill-color-lighter);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;

  .ratio-preview {
    width: 30px;
    height: 30px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: center;

    .ratio-rect {
      border: 1px solid var(--el-text-color-placeholder);
      border-radius: 2px;
    }
  }

  .ratio-name {
    font-size: 12px;
    margin: 0;
    color: var(--el-text-color-primary);
  }

  &:hover {
    background-color: var(--el-fill-color);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
  }

  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);

    .ratio-rect {
      border-color: var(--el-color-primary);
    }
  }
}
.scenario-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  &.is-disabled {
    opacity: 0.55;
  }
}
.scenario-card {
  border: 1px solid var(--el-border-color);
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  .scenario-thumb {
    width: 100%;
    aspect-ratio: 3 / 4;
    background-color: var(--el-fill-color);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      // Portrait crop anchored to the top so the subject's head is always
      // visible (thumbnails are portrait photos; a centered 16:9 crop hid the face).
      object-fit: cover;
      object-position: top center;
      display: block;
    }
  }

  .scenario-name {
    font-size: 11px;
    line-height: 1.25;
    margin: 0;
    padding: 5px 4px;
    text-align: center;
    color: var(--el-text-color-primary);
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .scenario-lock {
    display: block;
    padding: 0 4px 5px;
    color: var(--el-text-color-secondary);
    font-size: 10px;
    text-align: center;
  }

  &:focus-visible {
    outline: none;
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
  }

  &.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px var(--el-color-primary);

    .scenario-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}
</style>
