<template>
  <div class="panel">
    <model-selector v-if="false" v-model="preset.model" class="mb-4" />
    <ratio-selector v-model="preset.ratio" class="mb-4" />
    <quality-selector v-model="preset.quality" class="mb-4" />
    <version-selector v-model="preset.version" class="mb-4" />
    <advanced-selector v-model="preset.advanced" class="mb-4" />
    <stylize-selector v-if="preset.advanced" v-model="preset.stylize" class="mb-4" />
    <wired-selector v-if="preset.advanced" v-model="preset.wired" class="mb-4" />
    <chaos-selector v-if="preset.advanced" v-model="preset.chaos" class="mb-4" />
    <image-weight-selector v-if="preset.advanced" v-model="preset.iw" class="mb-4" />
    <raw-selector v-if="preset.advanced" v-model="preset.raw" class="mb-4" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import RatioSelector from './RatioSelector.vue';
import VersionSelector from './VersionSelector.vue';
import StylizeSelector from './StylizeSelector.vue';
import ChaosSelector from './ChaosSelector.vue';
import ModelSelector from './ModelSelector.vue';
import QualitySelector from './QualitySelector.vue';
import ImageWeightSelector from './ImageWeightSelector.vue';
import WiredSelector from './WiredSelector.vue';
import RawSelector from './RawSelector.vue';
import AdvancedSelector from './AdvancedSelector.vue';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    ModelSelector,
    QualitySelector,
    RatioSelector,
    VersionSelector,
    StylizeSelector,
    ChaosSelector,
    WiredSelector,
    RawSelector,
    AdvancedSelector,
    ImageWeightSelector
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      preset: this.modelValue
    };
  },
  watch: {
    modelValue(val) {
      this.preset = val;
    },
    preset: {
      handler(val) {
        this.$emit('update:modelValue', val);
      },
      deep: true
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  border-right: 1px solid var(--el-border-color);
  height: 100%;
  padding: 10px;
  background-color: var(--el-bg-color);
  .block {
    margin-bottom: 15px;
  }
}
</style>
