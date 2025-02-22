<template>
  <div class="panel flex flex-col">
    <div class="flex-1 overflow-y-scroll p-4">
      <model-selector class="mb-2" />
      <prompt-input class="mb-2" />
      <ratio-selector class="mb-4" />
      <quality-selector class="mb-4" />
      <version-selector class="mb-4" />
      <reference-image class="mb-2" />
      <elements-selector class="mb-2" />
      <stylize-selector class="mb-2" />
      <weird-selector class="mb-2" />
      <chaos-selector class="mb-2" />
      <image-weight-selector class="mb-2" />
      <style-selector class="mb-2" />
    </div>
    <div class="h-12 px-4">
      <div class="flex gap-1">
        <mode-selector />
        <el-button type="primary" class="btn w-full" round @click="$emit('generate')">
          {{ $t('midjourney.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import RatioSelector from './config/RatioSelector.vue';
import VersionSelector from './config/VersionSelector.vue';
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
    ChaosSelector,
    WeirdSelector,
    ImageWeightSelector,
    ReferenceImage
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
  border-right: 1px solid var(--el-border-color);
  flex: 1;
  height: calc(100% - 40px);
}
</style>
