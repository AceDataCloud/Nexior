<template>
  <div class="field">
    <div class="flex items-center mb-2">
      <h2 class="text-sm font-bold m-0">{{ $t('suno.name.underpaintingRange') }}</h2>
      <info-icon :content="$t('suno.description.underpainting')" />
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
    <div class="flex gap-2">
      <el-input-number
        v-model="underpaintingStart"
        class="flex-1"
        size="small"
        :min="0"
        :max="audio?.duration"
        :controls="false"
        :placeholder="$t('suno.placeholder.underpaintingStart')"
      />
      <el-input-number
        v-model="underpaintingEnd"
        class="flex-1"
        size="small"
        :min="underpaintingStart || 0"
        :max="audio?.duration"
        :controls="false"
        :placeholder="$t('suno.placeholder.underpaintingEnd')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInputNumber, ElImage } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { ISunoAudio } from '@/models';

export default defineComponent({
  name: 'UnderpaintingInput',
  components: {
    ElInputNumber,
    ElImage,
    InfoIcon
  },
  computed: {
    audio(): ISunoAudio | undefined {
      return this.$store.state.suno?.config?.audio;
    },
    underpaintingStart: {
      get() {
        return this.$store.state.suno?.config?.underpainting_start;
      },
      set(val: number | undefined) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          underpainting_start: val
        });
      }
    },
    underpaintingEnd: {
      get() {
        return this.$store.state.suno?.config?.underpainting_end;
      },
      set(val: number | undefined) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          underpainting_end: val
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
