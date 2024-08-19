<template>
  <div class="panel">
    <div class="config">
      <extend-from-input v-if="config?.video_id || config?.video_url" class="mb-4" />
      <prompt-input class="mb-4" />
      <custom-selector v-if="!config?.video_id" class="mb-4" />
      <upload-video v-if="config?.custom" class="mb-4" />
      <start-image-url-input v-if="!(config?.video_id || config?.video_url) && !config?.custom" class="mb-4" />
      <end-image-url-input class="mb-4" />
      <enhancement-selector class="mb-4" />
      <loop-selector class="mb-4" />
      <div class="actions">
        <el-button
          v-if="config?.video_url !== undefined || config?.custom"
          type="primary"
          class="btn w-full"
          round
          @click="onGenerate"
        >
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('luma.button.extend') }}
        </el-button>
        <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('luma.button.generate') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import EnhancementSelector from './config/EnhancementSelector.vue';
import CustomSelector from './config/CustomSelector.vue';
import LoopSelector from './config/LoopSelector.vue';
import EndImageUrlInput from './config/EndImageUrlInput.vue';
import StartImageUrlInput from './config/StartImageUrlInput.vue';
// @ts-ignore
import UploadVideo from './config/UploadVideo.vue';
import PromptInput from './config/PromptInput.vue';
import ExtendFromInput from './config/ExtendFromInput.vue';
export default defineComponent({
  name: 'PresetPanel',
  components: {
    LoopSelector,
    StartImageUrlInput,
    EndImageUrlInput,
    EnhancementSelector,
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ExtendFromInput,
    CustomSelector,
    UploadVideo
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.luma?.config;
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
