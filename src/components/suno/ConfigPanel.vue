<template>
  <div class="panel">
    <div class="config">
      <type-selector class="mb-4" />
      <prompt-input v-if="!config?.custom" class="mb-4" />
      <lyrics-input v-if="config?.custom && !config?.instrumental" class="mb-4" />
      <style-input v-if="config?.custom" class="mb-4" />
      <title-input v-if="config?.custom" class="mb-4" />
      <generate-button class="mb-4" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import TypeSelector from './config/TypeSelector.vue';
import PromptInput from './config/PromptInput.vue';
import LyricsInput from './config/LyricsInput.vue';
import StyleInput from './config/StyleInput.vue';
import TitleInput from './config/TitleInput.vue';
import GenerateButton from './config/GenerateButton.vue';

export default defineComponent({
  name: 'PresetPanel',
  components: {
    TypeSelector,
    PromptInput,
    LyricsInput,
    StyleInput,
    TitleInput,
    GenerateButton
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.suno?.config;
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
