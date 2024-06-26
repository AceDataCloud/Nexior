<template>
  <div class="panel">
    <model-selector class="mb-4" />
    <ratio-selector class="mb-4" />
    <mode-selector class="mb-4" />
    <quality-selector class="mb-4" />
    <version-selector class="mb-4" />
    <advanced-selector class="mb-4" />
    <stylize-selector v-if="preset.advanced" class="mb-4" />
    <weird-selector v-if="preset.advanced" class="mb-4" />
    <chaos-selector v-if="preset.advanced" class="mb-4" />
    <image-weight-selector v-if="preset.advanced" class="mb-4" />
    <style-selector v-if="preset.advanced" class="mb-4" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import RatioSelector from './preset/RatioSelector.vue';
import VersionSelector from './preset/VersionSelector.vue';
import StylizeSelector from './preset/StylizeSelector.vue';
import ChaosSelector from './preset/ChaosSelector.vue';
import ModelSelector from './preset/ModelSelector.vue';
import QualitySelector from './preset/QualitySelector.vue';
import ImageWeightSelector from './preset/ImageWeightSelector.vue';
import WeirdSelector from './preset/WeirdSelector.vue';
import AdvancedSelector from './preset/AdvancedSelector.vue';
import StyleSelector from './preset/StyleSelector.vue';
import ModeSelector from './preset/ModeSelector.vue';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    ModelSelector,
    ModeSelector,
    StyleSelector,
    QualitySelector,
    RatioSelector,
    VersionSelector,
    StylizeSelector,
    ChaosSelector,
    WeirdSelector,
    AdvancedSelector,
    ImageWeightSelector
  },
  computed: {
    preset() {
      return this.$store.state.midjourney.preset;
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  border-right: 1px solid var(--el-border-color);
  height: 100%;
  padding: 10px;
  .block {
    margin-bottom: 15px;
  }
}
</style>
