<template>
  <div class="panel flex flex-col h-full">
    <div class="flex-1 overflow-y-scroll p-4">
      <type-selector class="mb-4" />
      <content-input class="mb-4" />
      <prompt-input class="mb-4" />
      <aspect-ratio-selector class="mb-4" />
      <qrw-selector class="mb-4" />
      <preset-selector class="mb-4" />
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
    <div class="h-12 px-4">
      <el-button type="primary" class="btn w-full" round @click="$emit('generate')">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('qrart.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
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
import PresetSelector from './config/PresetSelector2.vue';
import ContentInput from './config/ContentInput.vue';
import PromptInput from './config/PromptInput.vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
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
    RotateSelector,
    PresetSelector,
    ContentInput,
    PromptInput
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
  border-right: 1px solid var(--el-border-color);
}
</style>
