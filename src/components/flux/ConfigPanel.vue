<template>
  <div class="panel">
    <div class="config">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <count-selector class="mb-4" />
      <div class="actions">
        <el-button type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('flux.button.generate') }}
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
import CountSelector from './config/CountSelector.vue';
import PromptInput from './config/PromptInput.vue';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ModelSelector,
    CountSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.flux?.config;
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
