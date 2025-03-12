<template>
  <div class="panel">
    <div class="config">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <mode-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <start-image class="mb-4" />
      <end-image class="mb-4" />
      <cfg-scale-selector class="mb-4" />
      <duration-selector class="mb-4" />
      <negative-prompt-input class="mb-4" />
      <div class="actions">
        <el-button
          v-if="config?.video_url !== undefined || config?.custom"
          type="primary"
          class="btn w-full"
          round
          @click="onGenerate"
        >
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('kling.button.extend') }}
        </el-button>
        <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('kling.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import ModeSelector from './config/ModeSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import StartImage from './config/StartImage.vue';
import EndImage from './config/EndImage.vue';
import CfgScaleSelector from './config/CfgScaleSelector.vue';
import PromptInput from './config/PromptInput.vue';
import NegativePromptInput from './config/NegativePromptInput.vue';
export default defineComponent({
  name: 'PresetPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    NegativePromptInput,
    ModelSelector,
    ModeSelector,
    DurationSelector,
    RatioSelector,
    StartImage,
    CfgScaleSelector,
    EndImage
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.kling?.config;
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
