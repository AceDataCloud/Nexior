<template>
  <div class="field">
    <div class="flex items-center mb-2">
      <h2 class="text-sm font-bold m-0">{{ $t('producer.name.replaceSection') }}</h2>
      <info-icon :content="$t('producer.description.replaceSection')" />
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
        v-model="replaceSectionStart"
        class="flex-1"
        :min="0"
        :max="audio?.duration"
        :controls="false"
        :placeholder="$t('producer.placeholder.replaceSectionStart')"
      />
      <el-input-number
        v-model="replaceSectionEnd"
        class="flex-1"
        :min="replaceSectionStart || 0"
        :max="audio?.duration"
        :controls="false"
        :placeholder="$t('producer.placeholder.replaceSectionEnd')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInputNumber, ElImage } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { IProducerAudio } from '@/models';

export default defineComponent({
  name: 'ReplaceSectionInput',
  components: {
    ElInputNumber,
    ElImage,
    InfoIcon
  },
  computed: {
    audio(): IProducerAudio | undefined {
      return this.$store.state.producer?.config?.audio;
    },
    replaceSectionStart: {
      get() {
        return this.$store.state.producer?.config?.replace_section_start;
      },
      set(val: number | undefined) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          replace_section_start: val
        });
      }
    },
    replaceSectionEnd: {
      get() {
        return this.$store.state.producer?.config?.replace_section_end;
      },
      set(val: number | undefined) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          replace_section_end: val
        });
      }
    }
  },
  methods: {
    onClick(audio: IProducerAudio) {
      this.$store.dispatch('producer/setAudio', {
        ...this.$store.state.producer.audio,
        ...audio,
        state: 'playing'
      });
    }
  }
});
</script>
