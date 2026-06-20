<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Source type -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.sourceType') }}</span>
        <el-radio-group v-model="sourceType" class="w-full">
          <el-radio-button :value="MAESTRO_SOURCE_TYPE_TOPIC">{{ $t('maestro.option.topic') }}</el-radio-button>
          <el-radio-button :value="MAESTRO_SOURCE_TYPE_ARTICLE">{{ $t('maestro.option.article') }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Source content -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.sourceRef') }}</span>
        <el-input v-model="sourceRef" type="textarea" :rows="5" :placeholder="$t('maestro.placeholder.sourceRef')" />
        <p class="text-xs text-[var(--el-text-color-secondary)] mt-1">{{ $t('maestro.description.sourceRef') }}</p>
      </div>

      <!-- Main language -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.lang') }}</span>
        <el-select v-model="lang" :placeholder="$t('maestro.placeholder.select')" class="w-full">
          <el-option v-for="l in MAESTRO_ALLOWED_LANGS" :key="l" :label="l" :value="l" />
        </el-select>
      </div>

      <!-- Extra languages -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('maestro.name.extraLangs') }}</span>
        <el-select
          v-model="extraLangs"
          multiple
          collapse-tags
          :placeholder="$t('maestro.placeholder.select')"
          class="w-full"
        >
          <el-option v-for="l in extraLangOptions" :key="l" :label="l" :value="l" />
        </el-select>
        <p class="text-xs text-[var(--el-text-color-secondary)] mt-1">{{ $t('maestro.description.extraLangs') }}</p>
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

      <!-- Music -->
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-bold">{{ $t('maestro.name.music') }}</span>
        <el-switch v-model="music" />
      </div>
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!sourceRef" @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('maestro.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElInput, ElSelect, ElOption, ElRadioGroup, ElRadioButton, ElSwitch } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import {
  MAESTRO_SOURCE_TYPE_TOPIC,
  MAESTRO_SOURCE_TYPE_ARTICLE,
  MAESTRO_ALLOWED_LANGS,
  MAESTRO_ALLOWED_ASPECTS,
  MAESTRO_ALLOWED_DURATIONS,
  MAESTRO_DEFAULT_SOURCE_TYPE,
  MAESTRO_DEFAULT_LANG,
  MAESTRO_DEFAULT_ASPECT,
  MAESTRO_DEFAULT_DURATION,
  MAESTRO_DEFAULT_MUSIC
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
    ElSwitch,
    Consumption,
    FontAwesomeIcon
  },
  emits: ['generate'],
  data() {
    return {
      MAESTRO_SOURCE_TYPE_TOPIC,
      MAESTRO_SOURCE_TYPE_ARTICLE,
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
    extraLangOptions(): string[] {
      return MAESTRO_ALLOWED_LANGS.filter((l) => l !== this.lang);
    },
    sourceType: {
      get(): string | undefined {
        return this.config?.source_type;
      },
      set(val: string) {
        this.update({ source_type: val });
      }
    },
    sourceRef: {
      get(): string | undefined {
        return this.config?.source_ref;
      },
      set(val: string) {
        this.update({ source_ref: val });
      }
    },
    lang: {
      get(): string | undefined {
        return this.config?.lang;
      },
      set(val: string) {
        // drop the new main language from extra_langs to avoid duplicate renders
        const extra = (this.config?.extra_langs || []).filter((l) => l !== val);
        this.update({ lang: val, extra_langs: extra });
      }
    },
    extraLangs: {
      get(): string[] {
        return this.config?.extra_langs || [];
      },
      set(val: string[]) {
        this.update({ extra_langs: val });
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
    music: {
      get(): boolean {
        return this.config?.music ?? true;
      },
      set(val: boolean) {
        this.update({ music: val });
      }
    }
  },
  mounted() {
    this.update({
      source_type: this.config?.source_type ?? MAESTRO_DEFAULT_SOURCE_TYPE,
      lang: this.config?.lang ?? MAESTRO_DEFAULT_LANG,
      aspect: this.config?.aspect ?? MAESTRO_DEFAULT_ASPECT,
      duration: this.config?.duration ?? MAESTRO_DEFAULT_DURATION,
      music: this.config?.music ?? MAESTRO_DEFAULT_MUSIC
    });
  },
  methods: {
    update(patch: Partial<IMaestroConfig>) {
      this.$store.commit('maestro/setConfig', {
        ...this.config,
        ...patch
      });
    },
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
