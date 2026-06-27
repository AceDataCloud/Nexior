<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <resolution-selector class="mb-4" />
      <duration-selector class="mb-4" />
      <image-input class="mb-2" />
      <reference-images-input v-if="supportsReferenceImages" class="mb-2" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('grokvideo.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import PromptInput from './config/PromptInput.vue';
import ModelSelector from './config/ModelSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import ImageInput from './config/ImageInput.vue';
import ReferenceImagesInput from './config/ReferenceImagesInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import { isGrokVideoImageOnlyModel } from '@/constants';

export default defineComponent({
  name: 'GrokVideoConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ModelSelector,
    DurationSelector,
    ResolutionSelector,
    RatioSelector,
    ImageInput,
    ReferenceImagesInput,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.grokvideo?.config;
    },
    // grok-imagine-video (1.0) accepts multiple reference images;
    // grok-imagine-video-1.5-preview is single-image only.
    supportsReferenceImages(): boolean {
      return !isGrokVideoImageOnlyModel(this.$store.state.grokvideo?.config?.model);
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.grokvideo?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
