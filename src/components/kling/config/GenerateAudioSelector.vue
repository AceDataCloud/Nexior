<template>
  <div v-if="visible" class="relative">
    <div class="flex justify-between items-center">
      <span class="text-sm font-bold">{{ $t('kling.name.generateAudio') }}</span>
      <el-switch v-model="value" class="value" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { KLING_DEFAULT_GENERATE_AUDIO, KLING_V3_MODELS } from '@/constants';

const AUDIO_SUPPORTED_MODELS = [...KLING_V3_MODELS, 'kling-v2-6'];

export default defineComponent({
  name: 'GenerateAudioSelector',
  components: {
    ElSwitch
  },
  computed: {
    selectedModel() {
      return this.$store.state.kling?.config?.model || '';
    },
    selectedMode() {
      return this.$store.state.kling?.config?.mode || '';
    },
    visible() {
      if (KLING_V3_MODELS.includes(this.selectedModel)) {
        return true;
      }
      if (this.selectedModel === 'kling-v2-6' && this.selectedMode === 'pro') {
        return true;
      }
      return false;
    },
    value: {
      get() {
        return this.$store.state.kling?.config?.generate_audio ?? KLING_DEFAULT_GENERATE_AUDIO;
      },
      set(val: boolean) {
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling?.config,
          generate_audio: val
        });
      }
    }
  },
  watch: {
    visible(newVal: boolean) {
      if (!newVal && this.value) {
        this.value = false;
      }
    }
  }
});
</script>
