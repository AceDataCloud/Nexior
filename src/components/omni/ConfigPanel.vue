<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <ratio-selector class="mb-4" />
      <resolution-selector class="mb-4" />
      <reference-images-input class="mb-4" />
      <video-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('omni.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import PromptInput from './config/PromptInput.vue';
import ResolutionSelector from './config/ResolutionSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import ReferenceImagesInput from './config/ReferenceImagesInput.vue';
import VideoInput from './config/VideoInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'OmniConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ResolutionSelector,
    RatioSelector,
    ReferenceImagesInput,
    VideoInput,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.omni?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.omni?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
