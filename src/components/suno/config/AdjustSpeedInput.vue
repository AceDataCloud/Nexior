<template>
  <div class="field">
    <div class="flex items-center mb-2">
      <h2 class="text-sm font-bold m-0">{{ $t('suno.name.adjustSpeed') }}</h2>
      <info-icon :content="$t('suno.description.adjustSpeed')" />
    </div>
    <div v-if="audio" class="task mb-2">
      <div class="audio flex items-center" @click="onClick(audio)">
        <div v-loading="!audio?.audio_url" class="left relative w-[50px] h-[50px] mr-3 flex-shrink-0">
          <el-image :src="audio?.image_url" class="w-full h-full rounded" fit="cover" />
        </div>
        <div class="info flex-1 min-w-0">
          <h2 class="text-sm font-bold m-0 truncate">{{ audio?.title }}</h2>
          <p class="text-xs text-[var(--el-text-color-secondary)] m-0 truncate">{{ audio?.style }}</p>
        </div>
      </div>
    </div>
    <el-radio-group v-model="speed" size="small" class="speed-group">
      <el-radio-button v-for="opt in options" :key="opt" :value="opt">{{ opt }}x</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElRadioGroup, ElRadioButton, ElImage } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { ISunoAudio } from '@/models';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default defineComponent({
  name: 'AdjustSpeedInput',
  components: {
    ElRadioGroup,
    ElRadioButton,
    ElImage,
    InfoIcon
  },
  data() {
    return {
      options: SPEED_OPTIONS
    };
  },
  computed: {
    audio(): ISunoAudio | undefined {
      return this.$store.state.suno?.config?.audio;
    },
    speed: {
      get(): number {
        const v = this.$store.state.suno?.config?.speed;
        return typeof v === 'number' ? v : 1;
      },
      set(val: number) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          speed: val
        });
      }
    }
  },
  methods: {
    onClick(audio: ISunoAudio) {
      this.$store.dispatch('suno/setAudio', {
        ...this.$store.state.suno.audio,
        ...audio,
        state: 'playing'
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.speed-group {
  display: flex;
  flex-wrap: wrap;
}
</style>
