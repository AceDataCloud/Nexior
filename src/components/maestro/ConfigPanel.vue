<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Remix banner: iterating on a previous video -->
      <el-alert v-if="isRemixing" :closable="false" type="info" class="mb-5">
        <p class="text-xs mb-1">
          <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
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
        <el-select
          v-model="langs"
          multiple
          collapse-tags
          :placeholder="$t('maestro.placeholder.select')"
          class="w-full"
        >
          <el-option v-for="l in MAESTRO_ALLOWED_LANGS" :key="l" :label="l" :value="l" />
        </el-select>
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
      <div class="field-block mb-5">
        <div class="field-head mb-2">
          <h2 class="field-title font-bold">{{ $t('maestro.name.scenario') }}</h2>
          <info-icon :content="$t('maestro.description.scenario')" class="ml-1" />
        </div>
        <div class="scenario-cards" role="radiogroup" :aria-label="$t('maestro.name.scenario')">
          <div
            v-for="s in MAESTRO_ALLOWED_SCENARIOS"
            :key="s"
            class="scenario-card"
            :class="{ active: scenario === s }"
            role="radio"
            :aria-checked="scenario === s"
            :aria-label="$t(`maestro.option.scenario.${s}`)"
            tabindex="0"
            @click="scenario = s"
            @keydown.enter.prevent="scenario = s"
            @keydown.space.prevent="scenario = s"
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
      <div class="field-row">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('maestro.name.style') }}</h2>
          <info-icon :content="$t('maestro.description.style')" class="ml-1" />
        </div>
        <el-select
          v-model="style"
          class="field-control"
          filterable
          allow-create
          default-first-option
          :placeholder="$t('maestro.placeholder.select')"
        >
          <el-option v-for="s in MAESTRO_ALLOWED_STYLES" :key="s" :label="$t(`maestro.option.style.${s}`)" :value="s" />
        </el-select>
      </div>

      <!-- Voice (narration timbre) + preview -->
      <div class="field-block mt-5">
        <div class="field-head mb-2">
          <h2 class="field-title font-bold">{{ $t('maestro.name.voice') }}</h2>
          <info-icon :content="$t('maestro.description.voice')" class="ml-1" />
        </div>
        <div class="voice-row">
          <el-select v-model="voice" class="voice-select" :placeholder="$t('maestro.placeholder.select')">
            <el-option
              v-for="v in MAESTRO_ALLOWED_VOICES"
              :key="v.key"
              :label="$t(`maestro.option.voice.${v.key}`)"
              :value="v.key"
            />
          </el-select>
          <el-button
            class="voice-play"
            :disabled="!currentSample"
            :title="$t('maestro.button.preview')"
            @click="onToggleSample"
          >
            <font-awesome-icon :icon="playing ? 'fa-solid fa-pause' : 'fa-solid fa-play'" />
          </el-button>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('maestro.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { ElButton, ElSelect, ElOption, ElInputNumber, ElAlert } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import FileUrlsInput from './config/FileUrlsInput.vue';
import {
  MAESTRO_ALLOWED_LANGS,
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
  MAESTRO_DEFAULT_SCENARIO,
  MAESTRO_ALLOWED_STYLES,
  MAESTRO_DEFAULT_STYLE,
  MAESTRO_ALLOWED_VOICES,
  MAESTRO_DEFAULT_VOICE
} from '@/constants';
import { IMaestroConfig } from '@/models';
import { isVideoUrl } from '@/utils/is';

// Preview rectangle dimensions (px) for each aspect-ratio chip.
const RATIO_PREVIEW: Record<string, { width: number; height: number }> = {
  '9:16': { width: 15, height: 26 },
  '16:9': { width: 26, height: 15 },
  '1:1': { width: 20, height: 20 }
};

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    ElSelect,
    ElOption,
    ElInputNumber,
    ElAlert,
    InfoIcon,
    PromptTextarea,
    FileUrlsInput,
    FontAwesomeIcon
  },
  emits: ['generate'],
  data() {
    return {
      MAESTRO_ALLOWED_LANGS,
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
        return this.config?.langs || [];
      },
      set(val: string[]) {
        // keep at least the primary language so billing/render always has one
        this.update({ langs: val.length ? val : MAESTRO_DEFAULT_LANGS });
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
        this.update({ style: val || MAESTRO_DEFAULT_STYLE });
      }
    },
    voice: {
      get(): string {
        return this.config?.voice || MAESTRO_DEFAULT_VOICE;
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
  mounted() {
    this.update({
      action: this.config?.action ?? MAESTRO_DEFAULT_ACTION,
      langs: this.config?.langs?.length ? this.config.langs : MAESTRO_DEFAULT_LANGS,
      aspect: this.config?.aspect ?? MAESTRO_DEFAULT_ASPECT,
      duration: this.config?.duration ?? MAESTRO_DEFAULT_DURATION,
      quality: this.config?.quality ?? MAESTRO_DEFAULT_QUALITY,
      // Drop stale persisted scenarios (e.g. the removed `slideshow`) back to the default.
      scenario:
        this.config?.scenario && MAESTRO_ALLOWED_SCENARIOS.includes(this.config.scenario)
          ? this.config.scenario
          : MAESTRO_DEFAULT_SCENARIO,
      style: this.config?.style ?? MAESTRO_DEFAULT_STYLE,
      // Drop a stale persisted voice not in the current catalog back to auto.
      voice:
        this.config?.voice && MAESTRO_ALLOWED_VOICES.some((v) => v.key === this.config!.voice)
          ? this.config.voice
          : MAESTRO_DEFAULT_VOICE
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
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
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
