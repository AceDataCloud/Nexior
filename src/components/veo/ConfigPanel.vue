<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <action-selector class="mb-4" />

      <!-- Post-processing actions: video_id is the source video. Show
           the preview if the user picked it from a previous task; show
           a manual input as a fallback for paste-from-clipboard. -->
      <template v-if="isPostProcessing">
        <video-from-input v-if="config?.video_url" class="mb-4" />
        <video-id-input class="mb-4" />
      </template>

      <!-- Per-action specific fields -->
      <upsample-action-selector v-if="config?.action === 'upsample'" class="mb-4" />

      <extend-model-selector v-if="config?.action === 'extend'" class="mb-4" />
      <prompt-input v-if="config?.action === 'extend'" class="mb-4" />

      <motion-type-selector v-if="config?.action === 'reshoot'" class="mb-4" />

      <prompt-input v-if="config?.action === 'object_insert'" class="mb-4" />
      <image-mask-input v-if="config?.action === 'object_insert' || config?.action === 'object_remove'" class="mb-4" />
      <prompt-input v-if="config?.action === 'object_remove'" class="mb-4" />

      <!-- Generation actions: text2video, image2video, ingredients2video -->
      <template v-if="isGeneration">
        <translation-selector class="mb-4" />
        <aspect-ratio-selector class="mb-4" />
        <prompt-input class="mb-4" />
        <model-selector v-if="config?.action !== 'ingredients2video'" class="mb-4" />
        <start-end-image
          v-if="config?.action === 'image2video' || config?.action === 'ingredients2video'"
          class="mb-2"
        />
      </template>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('veo.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import ActionSelector from './config/ActionSelector.vue';
import TranslationSelector from './config/TranslationSelector.vue';
import AspectRatioSelector from './config/AspectRatioSelector.vue';
import VideoFromInput from './config/VideoFromInput.vue';
import VideoIdInput from './config/VideoIdInput.vue';
import StartEndImage from './config/StartEndImage.vue';
import UpsampleActionSelector from './config/UpsampleActionSelector.vue';
import ExtendModelSelector from './config/ExtendModelSelector.vue';
import MotionTypeSelector from './config/MotionTypeSelector.vue';
import ImageMaskInput from './config/ImageMaskInput.vue';
import Consumption from '../common/Consumption.vue';
import PromptInput from './config/PromptInput.vue';
import { getConsumption } from '@/utils';

const POST_PROCESSING_ACTIONS = [
  'upsample',
  'extend',
  'reshoot',
  'object_insert',
  'object_remove',
  'get1080p' // legacy alias for upsample(1080p), kept for backward compat
];
const GENERATION_ACTIONS = ['text2video', 'image2video', 'ingredients2video'];

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    Consumption,
    FontAwesomeIcon,
    PromptInput,
    ModelSelector,
    StartEndImage,
    ActionSelector,
    VideoFromInput,
    VideoIdInput,
    UpsampleActionSelector,
    ExtendModelSelector,
    MotionTypeSelector,
    ImageMaskInput,
    TranslationSelector,
    AspectRatioSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.veo?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.veo?.service;
    },
    isPostProcessing() {
      return POST_PROCESSING_ACTIONS.includes(this.config?.action ?? '');
    },
    isGeneration() {
      return GENERATION_ACTIONS.includes(this.config?.action ?? '');
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
