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
          :max="MAESTRO_MAX_DURATION"
          :step="5"
          controls-position="right"
        />
      </div>

      <!-- Quality (production tier) -->
      <div class="field-row">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('maestro.name.quality') }}</h2>
          <info-icon :content="$t('maestro.description.quality')" class="ml-1" />
        </div>
        <el-select v-model="quality" class="field-control">
          <el-option
            v-for="q in MAESTRO_ALLOWED_QUALITIES"
            :key="q"
            :label="$t(`maestro.option.quality.${q}`)"
            :value="q"
          />
        </el-select>
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
              disabled: !scenarioCustomizationEnabled
            }"
            role="radio"
            :aria-checked="scenarioCustomizationEnabled && scenario === s"
            :aria-disabled="!scenarioCustomizationEnabled"
            :aria-label="$t(`maestro.option.scenario.${s}`)"
            :tabindex="scenarioCustomizationEnabled ? 0 : -1"
            @click="scenarioCustomizationEnabled && (scenario = s)"
            @keydown.enter.prevent="scenarioCustomizationEnabled && (scenario = s)"
            @keydown.space.prevent="scenarioCustomizationEnabled && (scenario = s)"
          >
            <div class="scenario-thumb">
              <img :src="MAESTRO_SCENARIO_THUMBNAILS[s]" :alt="$t(`maestro.option.scenario.${s}`)" loading="lazy" />
            </div>
            <p class="scenario-name">{{ $t(`maestro.option.scenario.${s}`) }}</p>
          </div>
        </div>
        <el-alert
          v-if="needsVideoUpload"
          :title="$t('maestro.message.captionsNeedVideo')"
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
  MAESTRO_MAX_DURATION,
  MAESTRO_DEFAULT_ACTION,
  MAESTRO_DEFAULT_LANGS,
  MAESTRO_DEFAULT_ASPECT,
  MAESTRO_DEFAULT_DURATION,
  MAESTRO_ALLOWED_QUALITIES,
  MAESTRO_DEFAULT_QUALITY,
  MAESTRO_ALLOWED_SCENARIOS,
  MAESTRO_SCENARIO_THUMBNAILS,
  MAESTRO_UPLOAD_REQUIRED_SCENARIOS,
  MAESTRO_ALLOWED_STYLES,
  MAESTRO_DEFAULT_STYLE,
  MAESTRO_ALLOWED_VOICES,
  MAESTRO_DEFAULT_VOICE
} from '@/constants';
import { IMaestroConfig } from '@/models';
import { isVideoUrl } from '@/utils/is';
import {
  getMaestroLanguageOptions,
  normalizeMaestroLanguages,
  setMaestroAdditionalLanguages,
  setMaestroPrimaryLanguage,
  type IMaestroLanguageOption
} from '@/utils/maestroLanguages';

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
    FileUrlsInput
  },
  emits: ['generate'],
  data() {
    return {
      MAESTRO_MIN_DURATION,
      MAESTRO_MAX_DURATION,
      MAESTRO_ALLOWED_QUALITIES,
      MAESTRO_ALLOWED_SCENARIOS,
      MAESTRO_SCENARIO_THUMBNAILS,
      MAESTRO_ALLOWED_STYLES,
      MAESTRO_ALLOWED_VOICES,
      playing: false,
      audioEl: null as HTMLAudioElement | null
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
    needsVideoUpload(): boolean {
      if (!this.scenarioCustomizationEnabled) return false;
      const scenario = this.config?.scenario;
      if (!scenario || !MAESTRO_UPLOAD_REQUIRED_SCENARIOS.includes(scenario)) return false;
      // captions post-processes a talking-head clip, so a video (not an image/audio) must be uploaded.
      return !(this.config?.file_urls || []).some((u) => isVideoUrl(u));
    },
    canGenerate(): boolean {
      return !!this.prompt?.trim() && !this.needsVideoUpload;
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
        this.update({ langs: setMaestroAdditionalLanguages(this.langs, val) });
      }
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
        const n = typeof val === 'number' && !Number.isNaN(val) ? val : MAESTRO_DEFAULT_DURATION;
        const clamped = Math.min(MAESTRO_MAX_DURATION, Math.max(MAESTRO_MIN_DURATION, Math.round(n)));
        this.update({ duration: clamped });
      }
    },
    quality: {
      get(): string | undefined {
        return this.config?.quality;
      },
      set(val: string) {
        this.update({ quality: val });
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
    }
  },
  watch: {
    voiceCustomizationEnabled(enabled: boolean) {
      if (!enabled) this.stopSample();
    },
    voice() {
      this.stopSample();
    }
  },
  mounted() {
    this.update({
      action: this.config?.action ?? MAESTRO_DEFAULT_ACTION,
      langs: normalizeMaestroLanguages(this.config?.langs),
      aspect: this.config?.aspect ?? MAESTRO_DEFAULT_ASPECT,
      duration: this.config?.duration ?? MAESTRO_DEFAULT_DURATION,
      quality: this.config?.quality ?? MAESTRO_DEFAULT_QUALITY
    });
  },
  beforeUnmount() {
    this.stopSample();
  },
  methods: {
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
