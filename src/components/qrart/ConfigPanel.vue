<template>
  <div class="panel">
    <div class="config">
      <type-selector class="mb-4" />
      <content-input class="mb-4" />
      <prompt-input class="mb-4" />
      <aspect-ratio-selector class="mb-4" />
      <qrw-selector class="mb-4" />
      <steps-selector class="mb-4" />
      <preset-selector class="mb-4" />
      <advanced-selector class="mb-4" />
      <seed-input v-if="config?.advanced" class="mb-4" />
      <position-selector v-if="config?.advanced" class="mb-4" />
      <pixel-style-selector v-if="config?.advanced" class="mb-4" />
      <marker-shape-selector v-if="config?.advanced" class="mb-4" />
      <sub-marker-selector v-if="config?.advanced" class="mb-4" />
      <rotate-selector v-if="config?.advanced" class="mb-4" />
      <ecl-selector v-if="config?.advanced" class="mb-4" />
      <padding-level-selector v-if="config?.advanced" class="mb-4" />
      <padding-noise-selector v-if="config?.advanced" class="mb-4" />
    </div>
    <div class="actions">
      <el-button type="primary" class="btn" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('qrart.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import TypeSelector from './config/TypeSelector.vue';
import ContentInput from './config/ContentInput.vue';
import PromptInput from './config/PromptInput.vue';
import AspectRatioSelector from './config/AspectRatioSelector.vue';
import QrwSelector from './config/QrwSelector.vue';
import StepsSelector from './config/StepsSelector.vue';
import PresetSelector from './config/PresetSelector.vue';
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
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    TypeSelector,
    FontAwesomeIcon,
    ContentInput,
    PositionSelector,
    PixelStyleSelector,
    PaddingLevelSelector,
    SeedInput,
    PromptInput,
    AspectRatioSelector,
    ElButton,
    QrwSelector,
    EclSelector,
    StepsSelector,
    PaddingNoiseSelector,
    PresetSelector,
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
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
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
    overflow-y: scroll;
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
