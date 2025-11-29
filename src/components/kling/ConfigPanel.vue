<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <start-image class="mb-2" />
      <end-image class="mb-2" />
      <duration-selector class="mb-4" />
      <mode-selector class="mb-4" />
      <cfg-scale-selector class="mb-4" />
      <negative-prompt-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <el-button
        v-if="config?.video_url !== undefined || config?.custom"
        type="primary"
        class="btn w-full"
        round
        @click="onGenerate"
      >
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('kling.button.extend') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('kling.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import ModeSelector from './config/ModeSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import StartImage from './config/StartImage.vue';
import EndImage from './config/EndImage.vue';
import Consumption from '../common/Consumption.vue';
import CfgScaleSelector from './config/CfgScaleSelector.vue';
import PromptInput from './config/PromptInput.vue';
import NegativePromptInput from './config/NegativePromptInput.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    Consumption,
    FontAwesomeIcon,
    PromptInput,
    NegativePromptInput,
    ModelSelector,
    ModeSelector,
    DurationSelector,
    RatioSelector,
    StartImage,
    CfgScaleSelector,
    EndImage
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.kling?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.kling?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
