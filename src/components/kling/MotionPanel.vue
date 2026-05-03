<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <motion-image class="mb-3" />
      <motion-video class="mb-3" />
      <motion-prompt-input class="mb-4" />
      <character-orientation-selector class="mb-4" />
      <motion-mode-selector class="mb-4" />
      <keep-original-sound-selector class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('kling.button.generateMotion') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Consumption from '../common/Consumption.vue';
import MotionImage from './motion/MotionImage.vue';
import MotionVideo from './motion/MotionVideo.vue';
import MotionPromptInput from './motion/MotionPromptInput.vue';
import CharacterOrientationSelector from './motion/CharacterOrientationSelector.vue';
import MotionModeSelector from './motion/MotionModeSelector.vue';
import KeepOriginalSoundSelector from './motion/KeepOriginalSoundSelector.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'MotionPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    Consumption,
    MotionImage,
    MotionVideo,
    MotionPromptInput,
    CharacterOrientationSelector,
    MotionModeSelector,
    KeepOriginalSoundSelector
  },
  emits: ['generate'],
  computed: {
    motionConfig() {
      return this.$store.state.kling?.motionConfig;
    },
    consumption() {
      return getConsumption(this.motionConfig, this.service?.cost);
    },
    service() {
      return this.$store.state.kling?.service;
    },
    canGenerate(): boolean {
      const cfg = this.motionConfig;
      return Boolean(cfg?.image_url && cfg?.video_url);
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
