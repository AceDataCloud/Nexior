<template>
  <div class="panel">
    <div class="config">
      <type-selector class="mb-4" />
      <upload-audio class="mb-4" />
      <prompt-input v-if="!config?.custom" class="mb-4" />
      <lyric-input v-if="config?.custom && !config.instrumental" class="mb-4" />
      <style-input v-if="config?.custom" class="mb-4" />
      <title-input v-if="config?.custom" class="mb-4" />
      <extend-from-input v-if="config?.action === 'extend'" class="mb-4" />
      <cover-from-input v-if="config?.action === 'cover'" class="mb-4" />
      <div class="actions">
        <el-button v-if="config?.action !== 'extend'" type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('suno.button.generate') }}
        </el-button>
        <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('suno.button.extend') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import TypeSelector from './config/TypeSelector.vue';
import UploadAudio from './config/UploadAudio.vue';
import PromptInput from './config/PromptInput.vue';
import LyricInput from './config/LyricInput.vue';
import StyleInput from './config/StyleInput.vue';
import TitleInput from './config/TitleInput.vue';
import ExtendFromInput from './config/ExtendFromInput.vue';
import CoverFromInput from './config/CoverFromInput.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    TypeSelector,
    PromptInput,
    LyricInput,
    StyleInput,
    TitleInput,
    ExtendFromInput,
    CoverFromInput,
    UploadAudio,
    FontAwesomeIcon,
    ElButton
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.suno?.config;
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
    position: relative;
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
