<template>
  <div v-if="!action || action === 'generate'">
    <el-button size="small" round @click="beginInspo">{{ $t('suno.button.inspo') }}</el-button>
  </div>
  <div v-else-if="action === 'inspo' || action === 'mashup'">
    <p class="text-sm font-bold mb-2">
      {{ $t(action === 'inspo' ? 'suno.name.inspirationTracks' : 'suno.name.mashupTracks') }}
    </p>
    <el-select
      v-model="references"
      multiple
      filterable
      :allow-create="action === 'inspo'"
      :multiple-limit="action === 'inspo' ? 4 : 2"
      class="w-full"
      :placeholder="$t('suno.placeholder.referenceSongs')"
    >
      <el-option
        v-for="song in songs"
        :key="song.id"
        :value="action === 'inspo' ? song.audio_url || '' : song.id || ''"
        :label="`${song.title || song.id} · ${formatTime(song.duration || 0)}`"
      />
    </el-select>
    <p class="text-xs text-[var(--el-text-color-secondary)] mt-2">
      {{ $t(action === 'inspo' ? 'suno.description.inspo' : 'suno.description.mashupTracks') }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { ElButton, ElSelect, ElOption } from 'element-plus';
import type { ISunoAudio, ISunoTask } from '@/models';
import { clearSunoOperation } from '@/utils/suno/operation';
import { useFormatDuring as formatTime } from '@/utils/number';
const store = useStore();
const action = computed(() => store.state.suno?.config?.action);
const songs = computed<ISunoAudio[]>(() =>
  (store.state.suno?.tasks?.items || [])
    .flatMap((task: ISunoTask) => (Array.isArray(task.response?.data) ? task.response.data : []))
    .filter((audio: ISunoAudio) => audio.id && audio.audio_url)
);
const references = computed<string[]>({
  get: () =>
    (action.value === 'inspo' ? store.state.suno?.config?.audio_urls : store.state.suno?.config?.mashup_audio_ids) ||
    [],
  set: (value) =>
    store.commit('suno/setConfig', {
      ...store.state.suno.config,
      [action.value === 'inspo' ? 'audio_urls' : 'mashup_audio_ids']: value
    })
});
function beginInspo() {
  store.commit('suno/setConfig', {
    ...clearSunoOperation(store.state.suno.config),
    action: 'inspo',
    model: 'chirp-v5',
    custom: true
  });
}
</script>
