<template>
  <div class="relative">
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.generateAudio') }}</span>
        <info-icon :content="tooltipContent" />
      </div>
      <el-switch v-model="value" class="value" :disabled="!supported" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { KLING_DEFAULT_GENERATE_AUDIO, KLING_V3_MODELS } from '@/constants';

export default defineComponent({
  name: 'GenerateAudioSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    selectedModel(): string {
      return this.$store.state.kling?.config?.model || '';
    },
    selectedMode(): string {
      return this.$store.state.kling?.config?.mode || '';
    },
    supported(): boolean {
      if (KLING_V3_MODELS.includes(this.selectedModel)) {
        return true;
      }
      if (this.selectedModel === 'kling-v2-6' && this.selectedMode === 'pro') {
        return true;
      }
      return false;
    },
    tooltipContent(): string {
      return this.supported
        ? this.$t('kling.description.generateAudio')
        : this.$t('kling.description.generateAudioUnsupported');
    },
    value: {
      get(): boolean {
        if (!this.supported) return false;
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
    supported(newVal: boolean) {
      // When option becomes unsupported, clear the persisted value so the request payload stays clean.
      if (!newVal && this.$store.state.kling?.config?.generate_audio) {
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling?.config,
          generate_audio: false
        });
      }
    }
  }
});
</script>
