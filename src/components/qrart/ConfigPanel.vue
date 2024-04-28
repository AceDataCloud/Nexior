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
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    TypeSelector,
    FontAwesomeIcon,
    ContentInput,
    PromptInput,
    AspectRatioSelector,
    ElButton,
    QrwSelector,
    StepsSelector,
    PresetSelector
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
