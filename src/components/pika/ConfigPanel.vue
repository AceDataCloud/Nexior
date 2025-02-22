<template>
  <div class="panel">
    <div class="config">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <ingredients-selector class="mb-4" />
      <effect-selector class="mb-4" />
      <image-url-input v-if="config?.ingredients" class="mb-4" />
      <ingredients-model-selector v-if="config?.ingredients" class="mb-4" />
      <div class="actions">
        <el-button
          v-if="config?.video_url !== undefined || config?.custom"
          type="primary"
          class="btn w-full"
          round
          @click="onGenerate"
        >
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('pika.button.extend') }}
        </el-button>
        <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('pika.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import IngredientsSelector from './config/IngredientsSelector.vue';
import EffectSelector from './config/EffectSelector.vue';
import IngredientsModelSelector from './config/IngredientsModelSelector.vue';
import ModelSelector from './config/ModelSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import PromptInput from './config/PromptInput.vue';
export default defineComponent({
  name: 'PresetPanel',
  components: {
    ImageUrlInput,
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    IngredientsSelector,
    IngredientsModelSelector,
    ModelSelector,
    EffectSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.pika?.config;
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
