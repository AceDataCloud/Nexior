<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <text-input class="mb-4" />
      <model-selector class="mb-4" />
      <div class="field mb-4">
        <h2 class="title font-bold">{{ $t('fish.name.voiceSource') }}</h2>
        <el-segmented v-model="voiceMode" :options="voiceModeOptions" class="value" />
      </div>
      <voice-picker v-if="voiceMode === 'saved'" class="mb-4" />
      <reference-audio-input v-else v-model="instantReference" class="mb-4" />
      <div class="field mb-4">
        <h2 class="title font-bold">{{ $t('fish.name.speed') }}</h2>
        <el-slider v-model="speed" :min="0.5" :max="2" :step="0.1" class="value" show-input />
      </div>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <service-pricing-summary :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('fish.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElSegmented, ElSlider } from 'element-plus';
import TextInput from './config/TextInput.vue';
import ModelSelector from './config/ModelSelector.vue';
import VoicePicker from './config/VoicePicker.vue';
import ReferenceAudioInput from './config/ReferenceAudioInput.vue';
import ServicePricingSummary from '../common/ServicePricingSummary.vue';
import { getConsumption } from '@/utils';
import { FISH_DEFAULT_PROSODY_SPEED, FISH_DEFAULT_TTS_MODEL } from '@/constants';
import { IFishReference, IFishVoiceMode } from '@/models';

export default defineComponent({
  name: 'FishConfigPanel',
  components: {
    MagicIcon,
    ElButton,
    ElSegmented,
    ElSlider,
    TextInput,
    ModelSelector,
    VoicePicker,
    ReferenceAudioInput,
    ServicePricingSummary
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.fish?.config;
    },
    consumption() {
      const text = this.config?.text?.trim() ?? '';
      return getConsumption(
        {
          ...this.config,
          model: this.config?.model ?? FISH_DEFAULT_TTS_MODEL,
          byte_count: new TextEncoder().encode(text).byteLength
        },
        this.service?.cost
      );
    },
    service() {
      return this.$store.state.fish?.service;
    },
    canGenerate(): boolean {
      const text = this.config?.text;
      if (typeof text !== 'string' || !text.trim()) return false;
      if (this.voiceMode !== 'instant') return true;
      const reference = this.instantReference;
      return !!reference?.audio && !!reference.text?.trim();
    },
    voiceModeOptions() {
      return [
        { label: this.$t('fish.value.savedVoice'), value: 'saved' },
        { label: this.$t('fish.value.instantVoice'), value: 'instant' }
      ];
    },
    voiceMode: {
      get(): IFishVoiceMode {
        return this.config?.voiceMode ?? 'saved';
      },
      set(mode: IFishVoiceMode) {
        this.$store.commit('fish/setConfig', {
          ...this.config,
          voiceMode: mode,
          reference_id: undefined,
          references: undefined
        });
      }
    },
    instantReference: {
      get(): IFishReference | undefined {
        return this.config?.references?.[0];
      },
      set(reference: IFishReference | undefined) {
        this.$store.commit('fish/setConfig', {
          ...this.config,
          voiceMode: 'instant',
          reference_id: undefined,
          references: reference ? [reference] : undefined
        });
      }
    },
    speed: {
      get(): number {
        return this.config?.prosody?.speed ?? FISH_DEFAULT_PROSODY_SPEED;
      },
      set(val: number) {
        this.$store.commit('fish/setConfig', {
          ...this.config,
          prosody: { ...(this.config?.prosody ?? {}), speed: val }
        });
      }
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
