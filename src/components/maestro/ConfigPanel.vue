<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Remix banner: iterating on a previous video -->
      <el-alert v-if="isRemixing" :closable="false" type="info" class="mb-4">
        <p class="text-xs mb-1">
          <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
          {{ $t('maestro.name.remixing') }}: {{ refTaskId }}
        </p>
        <el-button size="small" text @click="onClearRemix">{{ $t('maestro.button.cancelRemix') }}</el-button>
      </el-alert>

      <!-- Prompt -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.prompt') }}</span>
        <el-input v-model="prompt" type="textarea" :rows="6" :placeholder="$t('maestro.placeholder.prompt')" />
        <p class="text-xs text-[var(--el-text-color-secondary)] mt-1">{{ $t('maestro.description.prompt') }}</p>
      </div>

      <!-- Reference files -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.files') }}</span>
        <file-urls-input />
      </div>

      <!-- Languages -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.langs') }}</span>
        <el-select
          v-model="langs"
          multiple
          collapse-tags
          :placeholder="$t('maestro.placeholder.select')"
          class="w-full"
        >
          <el-option v-for="l in MAESTRO_ALLOWED_LANGS" :key="l" :label="l" :value="l" />
        </el-select>
        <p class="text-xs text-[var(--el-text-color-secondary)] mt-1">{{ $t('maestro.description.langs') }}</p>
      </div>

      <!-- Aspect ratio -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.aspect') }}</span>
        <el-radio-group v-model="aspect" class="w-full">
          <el-radio-button v-for="a in MAESTRO_ALLOWED_ASPECTS" :key="a" :value="a">{{ a }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Duration -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.duration') }}</span>
        <el-select v-model="duration" class="w-full">
          <el-option v-for="d in MAESTRO_ALLOWED_DURATIONS" :key="d" :label="`${d}s`" :value="d" />
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
import { ElButton, ElInput, ElSelect, ElOption, ElRadioGroup, ElRadioButton, ElAlert } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Consumption from '../common/Consumption.vue';
import FileUrlsInput from './config/FileUrlsInput.vue';
import { getConsumption } from '@/utils';
import {
  MAESTRO_ALLOWED_LANGS,
  MAESTRO_ALLOWED_ASPECTS,
  MAESTRO_ALLOWED_DURATIONS,
  MAESTRO_DEFAULT_ACTION,
  MAESTRO_DEFAULT_LANGS,
  MAESTRO_DEFAULT_ASPECT,
  MAESTRO_DEFAULT_DURATION
} from '@/constants';
import { IMaestroConfig } from '@/models';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    ElInput,
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadioButton,
    ElAlert,
    Consumption,
    FileUrlsInput,
    FontAwesomeIcon
  },
  emits: ['generate'],
  data() {
    return {
      MAESTRO_ALLOWED_LANGS,
      MAESTRO_ALLOWED_ASPECTS,
      MAESTRO_ALLOWED_DURATIONS
    };
  },
  computed: {
    config(): IMaestroConfig | undefined {
      return this.$store.state.maestro?.config;
    },
    service() {
      return this.$store.state.maestro?.service;
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
    }
  },
  mounted() {
    this.update({
      action: this.config?.action ?? MAESTRO_DEFAULT_ACTION,
      langs: this.config?.langs?.length ? this.config.langs : MAESTRO_DEFAULT_LANGS,
      aspect: this.config?.aspect ?? MAESTRO_DEFAULT_ASPECT,
      duration: this.config?.duration ?? MAESTRO_DEFAULT_DURATION
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
