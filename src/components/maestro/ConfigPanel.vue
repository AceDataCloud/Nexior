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
        <el-select v-model="duration" class="field-control">
          <el-option v-for="d in MAESTRO_ALLOWED_DURATIONS" :key="d" :label="`${d}s`" :value="d" />
        </el-select>
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
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('maestro.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElSelect, ElOption, ElAlert } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Consumption from '../common/Consumption.vue';
import InfoIcon from '@/components/common/InfoIcon.vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import FileUrlsInput from './config/FileUrlsInput.vue';
import { getConsumption } from '@/utils';
import {
  MAESTRO_ALLOWED_LANGS,
  MAESTRO_ALLOWED_ASPECTS,
  MAESTRO_ALLOWED_DURATIONS,
  MAESTRO_DEFAULT_ACTION,
  MAESTRO_DEFAULT_LANGS,
  MAESTRO_DEFAULT_ASPECT,
  MAESTRO_DEFAULT_DURATION,
  MAESTRO_ALLOWED_QUALITIES,
  MAESTRO_DEFAULT_QUALITY
} from '@/constants';
import { IMaestroConfig } from '@/models';

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
    ElAlert,
    Consumption,
    InfoIcon,
    PromptTextarea,
    FileUrlsInput,
    FontAwesomeIcon
  },
  emits: ['generate'],
  data() {
    return {
      MAESTRO_ALLOWED_LANGS,
      MAESTRO_ALLOWED_DURATIONS,
      MAESTRO_ALLOWED_QUALITIES
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
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    isRemixing(): boolean {
      const action = this.config?.action;
      return !!action && action !== MAESTRO_DEFAULT_ACTION && !!this.config?.ref_task_id;
    },
    refTaskId(): string | undefined {
      return this.config?.ref_task_id;
    },
    canGenerate(): boolean {
      return !!this.prompt?.trim();
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
        this.update({ duration: val });
      }
    },
    quality: {
      get(): string | undefined {
        return this.config?.quality;
      },
      set(val: string) {
        this.update({ quality: val });
      }
    }
  },
  mounted() {
    this.update({
      action: this.config?.action ?? MAESTRO_DEFAULT_ACTION,
      langs: this.config?.langs?.length ? this.config.langs : MAESTRO_DEFAULT_LANGS,
      aspect: this.config?.aspect ?? MAESTRO_DEFAULT_ASPECT,
      duration: this.config?.duration ?? MAESTRO_DEFAULT_DURATION,
      quality: this.config?.quality ?? MAESTRO_DEFAULT_QUALITY
    });
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
</style>
