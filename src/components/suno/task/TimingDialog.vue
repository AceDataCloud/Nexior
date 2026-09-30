<template>
  <el-dialog v-model="visible" :title="$t('suno.name.lyricTiming')" width="640px" class="suno-timing-dialog">
    <p class="text-sm text-[var(--el-text-color-secondary)]">{{ audio.title }}</p>
    <div v-if="words.length" class="timing-words">
      <button v-for="(word, index) in words" :key="index" type="button" class="timing-word" @click="seek(word.start_s)">
        <time>{{ formatTime(word.start_s) }}</time>
        <span>{{ word.word }}</span>
      </button>
    </div>
    <p v-else class="text-sm text-[var(--el-text-color-secondary)]">{{ $t('suno.message.noTiming') }}</p>
    <template #footer>
      <el-button :disabled="!words.length" @click="download">{{ $t('suno.button.downloadSubtitles') }}</el-button>
      <el-button type="primary" @click="visible = false">{{ $t('common.button.close') }}</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { useStore } from 'vuex';
import { ElDialog, ElButton } from 'element-plus';
import { saveAs } from 'file-saver';
import type { ISunoAudio } from '@/models';
import { useFormatDuring as formatTime } from '@/utils/number';
import { timingWords, timingSrt } from '@/utils/suno/timing';
const props = defineProps<{ modelValue: boolean; audio: ISunoAudio; data: unknown }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
const store = useStore();
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) });
const words = computed(() => timingWords(props.data));
async function seek(progress: number) {
  if (!props.audio.audio_url) return;
  await store.dispatch('suno/setAudio', { ...store.state.suno.audio, ...props.audio, progress, state: 'playing' });
  await nextTick();
  const object = store.state.suno.audio?.object as HTMLAudioElement | undefined;
  if (!object) return;
  const applySeek = () => {
    if (store.state.suno.audio?.object === object) object.currentTime = progress;
  };
  if (object.readyState >= 1) applySeek();
  else object.addEventListener('loadedmetadata', applySeek, { once: true });
}
function download() {
  saveAs(
    new Blob([timingSrt(words.value)], { type: 'text/plain;charset=utf-8' }),
    `${props.audio.title || 'suno'}.srt`
  );
}
</script>
<style scoped lang="scss">
.timing-words {
  max-height: 50vh;
  overflow: auto;
}
.timing-word {
  display: flex;
  gap: 16px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  color: var(--el-text-color-regular);
  cursor: pointer;
  &:hover {
    background: var(--el-fill-color-light);
  }
  time {
    color: var(--el-color-primary);
    font-variant-numeric: tabular-nums;
  }
  span {
    white-space: pre-wrap;
  }
}
</style>
