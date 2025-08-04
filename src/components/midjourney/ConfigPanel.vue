<template>
  <div class="panel flex flex-col">
    <div class="flex-1 overflow-y-scroll p-4">
      <is-videos-selector class="mb-2" />
      <model-selector v-if="!config.is_videos" class="mb-2" />
      <prompt-input class="mb-2" />
      <image-url-input v-if="config.is_videos" class="mb-2" />
      <reference-image v-if="!config.is_videos" class="mb-2" />
      <ratio-selector v-if="!config.is_videos" class="mb-4" />
      <quality-selector v-if="!config.is_videos" class="mb-4" />
      <version-selector v-if="!config.is_videos" class="mb-4" />
      <reference-image v-if="!config.is_videos" class="mb-2" />
      <elements-selector v-if="!config.is_videos" class="mb-2" />
      <advanced-selector v-if="!config.is_videos" class="mb-2" />
      <stylize-selector v-show="config.advanced" class="mb-2" />
      <weird-selector v-show="config.advanced" class="mb-2" />
      <chaos-selector v-show="config.advanced" class="mb-2" />
      <image-weight-selector v-show="config.advanced" class="mb-2" />
      <style-selector v-show="config.advanced" class="mb-2" />
    </div>
    <div class="h-12 px-4">
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
    ImageUrlInput
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.midjourney.config;
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  flex: 1;
  height: calc(100% - 40px);
}
</style>
