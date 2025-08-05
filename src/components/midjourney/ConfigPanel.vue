<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <is-videos-selector class="mb-2" />
      <model-selector v-if="!config.is_videos" class="mb-2" />
      <prompt-input class="mb-2" />
      <image-url-input v-if="config.is_videos" class="mb-2" />
      <reference-image v-if="!config.is_videos" class="mb-2" />
      <ratio-selector v-if="!config.is_videos" class="mb-4" />
      <quality-selector v-if="!config.is_videos" class="mb-4" />
      <version-selector v-if="!config.is_videos" class="mb-4" />
      <elements-selector v-if="!config.is_videos" class="mb-2" />
      <advanced-selector v-if="!config.is_videos" class="mb-2" />
      <stylize-selector v-show="config.advanced" class="mb-2" />
      <weird-selector v-show="config.advanced" class="mb-2" />
      <chaos-selector v-show="config.advanced" class="mb-2" />
      <image-weight-selector v-show="config.advanced" class="mb-2" />
      <style-selector v-show="config.advanced" class="mb-2" />
    </div>
    <div class="flex flex-col px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <div class="flex gap-1">
        <mode-selector />
        <el-button v-if="config.action === 'extend'" type="primary" class="btn w-full" round @click="$emit('generate')">
          {{ $t('midjourney.button.extend') }}
        </el-button>
        <el-button v-else type="primary" class="btn w-full" round @click="$emit('generate')">
          {{ $t('midjourney.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RatioSelector from './config/RatioSelector.vue';
import AdvancedSelector from './config/AdvancedSelector.vue';
import IsVideosSelector from './config/IsVideosSelector.vue';
import VersionSelector from './config/VersionSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import StylizeSelector from './config/StylizeSelector.vue';
import ChaosSelector from './config/ChaosSelector.vue';
import ModelSelector from './config/ModelSelector.vue';
import QualitySelector from './config/QualitySelector.vue';
import ImageWeightSelector from './config/ImageWeightSelector.vue';
import WeirdSelector from './config/WeirdSelector.vue';
import StyleSelector from './config/StyleSelector.vue';
import ElementsSelector from './config/ElementsSelector.vue';
import ModeSelector from './config/ModeSelector2.vue';
import PromptInput from './config/PromptInput.vue';
import ReferenceImage from './config/ReferenceImage.vue';
import { ElButton } from 'element-plus';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    PromptInput,
    ModeSelector,
    ModelSelector,
    ElementsSelector,
    StyleSelector,
    QualitySelector,
    RatioSelector,
    VersionSelector,
    StylizeSelector,
    AdvancedSelector,
    ChaosSelector,
    WeirdSelector,
    ImageWeightSelector,
    ReferenceImage,
    IsVideosSelector,
    ImageUrlInput,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.midjourney.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.metadata?.price);
    },
    service() {
      return this.$store.state.midjourney?.service;
    }
  }
});
</script>
