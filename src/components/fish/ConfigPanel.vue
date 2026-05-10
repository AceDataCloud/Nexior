<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <text-input class="mb-4" />
      <model-selector class="mb-4" />
      <voice-picker class="mb-4" />
      <div class="field mb-2">
        <h2 class="title font-bold">{{ $t('fish.name.speed') }}</h2>
        <el-slider v-model="speed" :min="0.5" :max="2" :step="0.1" class="value" show-input />
      </div>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('fish.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElSlider } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TextInput from './config/TextInput.vue';
import ModelSelector from './config/ModelSelector.vue';
import VoicePicker from './config/VoicePicker.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import { FISH_DEFAULT_PROSODY_SPEED } from '@/constants';

export default defineComponent({
  name: 'FishConfigPanel',
  components: {
    ElButton,
    ElSlider,
    FontAwesomeIcon,
    TextInput,
    ModelSelector,
    VoicePicker,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.fish?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.fish?.service;
    },
    canGenerate(): boolean {
      const text = this.config?.text;
      return typeof text === 'string' && text.trim().length > 0;
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
