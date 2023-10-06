<template>
  <div class="panel">
    <model-selector v-model="preset.model" class="block" />
    <ratio-selector v-model="preset.ratio" class="block" />
    <version-selector v-model="preset.version" class="block" />

    <stylize-selector v-model="preset.stylize" class="block" />
    <chaos-selector v-model="preset.chaos" class="block" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import RatioSelector from './RatioSelector.vue';
import VersionSelector from './VersionSelector.vue';
import StylizeSelector from './StylizeSelector.vue';
import ChaosSelector from './ChaosSelector.vue';
import ModelSelector from './ModelSelector.vue';
export default defineComponent({
  name: 'PresetPanel',
  components: {
    ModelSelector,
    RatioSelector,
    VersionSelector,
    StylizeSelector,
    ChaosSelector
  },
  data() {
    return {
      preset: {
        ratio: undefined,
        version: undefined,
        stylize: undefined,
        chaos: undefined
      }
    };
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
