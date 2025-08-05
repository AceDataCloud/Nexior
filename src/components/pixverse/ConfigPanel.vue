<template>
  <div class="panel">
    <div class="config">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <style-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <motion-selector class="mb-4" />
      <quality-selector class="mb-4" />
      <start-image class="mb-2" />
      <seed-selector class="mb-4" />
      <duration-selector class="mb-4" />
      <div class="actions">
        <el-button type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('pixverse.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import QualitySelector from './config/QualitySelector.vue';
import MotionSelector from './config/MotionSelector.vue';
import StyleSelector from './config/StyleSelector.vue';
import SeedSelector from './config/SeedSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import StartImage from './config/StartImage.vue';
import PromptInput from './config/PromptInput.vue';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ModelSelector,
    QualitySelector,
    MotionSelector,
    StyleSelector,
    DurationSelector,
    StartImage,
    SeedSelector,
    RatioSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.pixverse?.config;
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
  flex: 1;
  height: calc(100% - 40px);
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
