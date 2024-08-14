<template>
  <div class="panel">
    <div class="config">
      <type-selector class="mb-4" />
      <aspect-ratio-selector class="mb-4" />
      <qrw-selector class="mb-4" />
      <position-selector class="mb-4" />
      <advanced-selector class="mb-4" />
      <steps-selector v-if="config?.advanced" class="mb-4" />
      <seed-input v-if="config?.advanced" class="mb-4" />
      <pixel-style-selector v-if="config?.advanced" class="mb-4" />
      <marker-shape-selector v-if="config?.advanced" class="mb-4" />
      <sub-marker-selector v-if="config?.advanced" class="mb-4" />
      <rotate-selector v-if="config?.advanced" class="mb-4" />
      <ecl-selector v-if="config?.advanced" class="mb-4" />
      <padding-level-selector v-if="config?.advanced" class="mb-4" />
      <padding-noise-selector v-if="config?.advanced" class="mb-4" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import TypeSelector from './config/TypeSelector.vue';
import AspectRatioSelector from './config/AspectRatioSelector.vue';
import QrwSelector from './config/QrwSelector.vue';
import StepsSelector from './config/StepsSelector.vue';
import AdvancedSelector from './config/AdvancedSelector.vue';
import MarkerShapeSelector from './config/MarkerShapeSelector.vue';
import SubMarkerSelector from './config/SubMarkerSelector.vue';
import RotateSelector from './config/RotateSelector.vue';
import EclSelector from './config/EclSelector.vue';
import PositionSelector from './config/PositionSelector.vue';
import PaddingLevelSelector from './config/PaddingLevelSelector.vue';
import PaddingNoiseSelector from './config/PaddingNoiseSelector.vue';
import PixelStyleSelector from './config/PixelStyleSelector.vue';
import SeedInput from './config/SeedInput.vue';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    TypeSelector,
    PositionSelector,
    PixelStyleSelector,
    PaddingLevelSelector,
    SeedInput,
    AspectRatioSelector,
    QrwSelector,
    EclSelector,
    StepsSelector,
    PaddingNoiseSelector,
    AdvancedSelector,
    MarkerShapeSelector,
    SubMarkerSelector,
    RotateSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.qrart?.config;
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  height: 100%;
  padding: 15px;
  display: flex;
  flex-direction: column;
  .config {
    width: 100%;
    height: calc(100% - 50px);
    flex: 1;
  }
  .actions {
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    .btn {
      width: 100%;
    }
  }
}
</style>
