<template>
  <div class="panel">
    <div class="config">
      <elements-selector class="mb-4" />
      <mode-selector class="mb-4" />
      <image-urls-input class="mb-4" />
      <div class="actions">
        <el-button type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('headshots.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ImageUrlsInput from './config/ImageUrlsInput.vue';
// @ts-ignore
import ModeSelector from './config/ModeSelector.vue';
import ElementsSelector from './config/ElementsSelector.vue';
export default defineComponent({
  name: 'PresetPanel',
  components: {
    ModeSelector,
    ImageUrlsInput,
    ElButton,
    FontAwesomeIcon,
    ElementsSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.headshots?.config;
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
