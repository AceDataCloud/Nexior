<template>
  <div ref="scrollElement" class="acemusic-results" @scroll="onScroll">
    <div v-if="loading && !tasks.length" class="p-8"><el-skeleton :rows="6" animated /></div>
    <div v-else-if="!tasks.length" class="empty-state">
      <h2>{{ $t('acemusic.empty.title') }}</h2>
      <p>{{ $t('acemusic.empty.description') }}</p>
    </div>
    <article v-for="task in tasks" :key="task.id" class="task-group">
      <header class="flex items-center justify-between gap-2 mb-3">
        <span class="text-xs text-[var(--el-text-color-secondary)]">{{ formatDate(task.created_at) }}</span>
        <el-tag :type="statusType(task)" size="small">{{ stateLabel(task) }}</el-tag>
      </header>
      <div class="songs">
        <div v-for="(audio, index) in tracks(task)" :key="audio.id || `${task.id}-${index}`" class="song">
          <button
            class="song-cover"
            :disabled="!playable(audio)"
            :aria-label="playing(audio) ? $t('common.player.pause') : $t('common.player.play')"
            @click="play(audio)"
          >
            <img v-if="audio.image_url" :src="audio.image_url" alt="" @error="hideFailedCover" />
            <span class="cover-fallback" aria-hidden="true">♪</span>
            <span v-if="playable(audio)" class="play-overlay">{{ playing(audio) ? 'Ⅱ' : '▶' }}</span>
            <span v-else class="play-overlay">{{
              stateLabel({ id: audio.id, state: audio.state || state(task) })
            }}</span>
          </button>
          <div class="song-info">
            <h3>{{ audio.title || $t('acemusic.track', { number: index + 1 }) }}</h3>
            <p>{{ audio.style || task.request?.style }}</p>
            <small>{{ audio.duration ? formatDuration(audio.duration) : '' }}</small>
          </div>
          <div class="song-actions">
            <el-button v-if="audio.lyric" size="small" @click="selectedLyrics = audio">{{
              $t('acemusic.field.lyric')
            }}</el-button>
            <el-button
              v-if="playable(audio)"
              size="small"
              :loading="downloading === audio.id"
              @click="download(audio)"
              >{{ $t('acemusic.button.download') }}</el-button
            >
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-3 items-center">
        <el-button v-if="task.request" size="small" @click="$emit('reuse', task)">{{
          $t('acemusic.button.reuse')
        }}</el-button>
        <api-code-button v-if="task.request" path="/acemusic/audios" :body="task.request" />
        <el-button size="small" text @click="detailTask = task">{{ $t('acemusic.button.details') }}</el-button>
      </div>
    </article>
    <el-dialog
      :model-value="Boolean(selectedLyrics)"
      :title="selectedLyrics?.title || $t('acemusic.field.lyric')"
      width="min(640px, 94vw)"
      @close="selectedLyrics = undefined"
    >
      <pre class="lyrics">{{ selectedLyrics?.lyric }}</pre>
    </el-dialog>
    <el-dialog
      :model-value="Boolean(detailTask)"
      :title="$t('acemusic.button.details')"
      width="min(640px, 94vw)"
      @close="detailTask = undefined"
    >
      <p class="break-all">{{ $t('acemusic.field.taskId') }}: {{ detailTask?.id }}</p>
      <p v-if="detailTask?.trace_id || detailTask?.response?.trace_id" class="break-all">
        Trace ID: {{ detailTask?.trace_id || detailTask?.response?.trace_id }}
      </p>
      <p v-if="detailTask?.response?.error" class="mt-3 break-words">{{ errorText(detailTask) }}</p>
      <p v-if="detailTask && state(detailTask) === 'submission_unknown'" class="mt-3">
        {{ $t('acemusic.message.unknown') }}
      </p>
      <p v-if="detailTask && state(detailTask) === 'partial_failed'" class="mt-3">
        {{ $t('acemusic.message.partial') }}
      </p>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { ElButton, ElDialog, ElMessage, ElSkeleton, ElTag } from 'element-plus';
import { saveAs } from 'file-saver';
import type { IAcemusicAudio, IAcemusicTask } from '@/models';
import { acemusicTaskState as state, isAcemusicAudioPlayable as playable } from '@/utils/acemusic';
import { t } from '@/i18n';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';
defineProps<{ loading?: boolean }>();
const emit = defineEmits<{ 'reach-top': []; reuse: [task: IAcemusicTask] }>();
const store = useStore(),
  scrollElement = ref<HTMLElement>();
const downloading = ref<string>();
const selectedLyrics = ref<IAcemusicAudio>(),
  detailTask = ref<IAcemusicTask>();
const tasks = computed<IAcemusicTask[]>(() => store.state.acemusic.tasks?.items || []);
const tracks = (task: IAcemusicTask): IAcemusicAudio[] => {
  const result = Array.isArray(task.response?.data) ? task.response.data : [];
  return [0, 1].map(
    (index) =>
      result[index] || {
        id: `${task.id}-${index}`,
        title: task.request?.title,
        state: state(task) === 'partial_failed' ? 'failed' : state(task)
      }
  );
};
const playing = (audio: IAcemusicAudio) =>
  store.state.acemusic.audio?.id === audio.id && store.state.acemusic.audio?.state === 'playing';
async function download(audio: IAcemusicAudio) {
  if (!audio.audio_url || downloading.value) return;
  downloading.value = audio.id;
  try {
    const response = await fetch(audio.audio_url);
    if (!response.ok) throw new Error('Audio download failed');
    const blob = await response.blob();
    if (!blob.size) throw new Error('Audio download is empty');
    saveAs(blob, `${audio.title || 'ACE Music'}.mp3`);
  } catch {
    ElMessage.error(t('acemusic.message.downloadFailed'));
  } finally {
    downloading.value = undefined;
  }
}
function play(audio: IAcemusicAudio) {
  if (!playable(audio)) return;
  store.dispatch('acemusic/setAudio', {
    ...store.state.acemusic.audio,
    ...audio,
    state: playing(audio) ? 'paused' : 'playing',
    progress: store.state.acemusic.audio?.id === audio.id ? store.state.acemusic.audio?.progress || 0 : 0
  });
}
function stateLabel(task: IAcemusicTask) {
  const value = state(task);
  return t(
    `acemusic.state.${['succeeded', 'partial_failed', 'failed', 'submission_unknown', 'storing'].includes(value) ? value : 'processing'}`
  );
}
function statusType(task: IAcemusicTask): 'success' | 'danger' | 'warning' | 'info' {
  const value = state(task);
  return value === 'succeeded'
    ? 'success'
    : value === 'failed'
      ? 'danger'
      : ['partial_failed', 'submission_unknown'].includes(value)
        ? 'warning'
        : 'info';
}
function errorText(task?: IAcemusicTask) {
  const error = task?.response?.error;
  return typeof error === 'string' ? error : error?.message;
}
const formatDate = (value?: number) => (value ? new Date(value * 1000).toLocaleString() : '');
const formatDuration = (value: number) =>
  `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
const onScroll = () => {
  if (scrollElement.value && scrollElement.value.scrollTop < 120) emit('reach-top');
};
const hideFailedCover = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none';
};
defineExpose({ getScrollElement: () => scrollElement.value });
</script>
<style scoped>
.acemusic-results {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
}
.empty-state {
  min-height: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--el-text-color-secondary);
  gap: 12px;
}
.empty-state h2 {
  font-size: 22px;
  color: var(--el-text-color-primary);
}
.empty-state p {
  max-width: 380px;
}
.task-group {
  max-width: 1000px;
  margin: 0 auto 20px;
  padding: 16px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 12px;
  background: var(--app-sidebar-bg);
}
.songs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.song {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 72px;
}
.song-cover {
  position: relative;
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  overflow: hidden;
  border-radius: 9px;
  background: linear-gradient(135deg, #7954c5, #315b89);
  color: white;
}
.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  z-index: 1;
}
.cover-fallback {
  font-size: 30px;
}
.play-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0004;
  font-size: 12px;
}
.song-cover:enabled {
  cursor: pointer;
}
.song-info {
  flex: 1;
  min-width: 0;
}
.song-info h3 {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.song-info p,
.song-info small {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.song-info p {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.song-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.download {
  font-size: 12px;
  color: var(--el-color-primary);
}
.lyrics {
  white-space: pre-wrap;
  font: inherit;
  line-height: 1.8;
}
@media (max-width: 767px) {
  .acemusic-results {
    padding: 10px;
  }
  .song {
    gap: 10px;
    flex-wrap: wrap;
  }
  .song-info {
    min-width: calc(100% - 78px);
  }
  .song-actions {
    margin-left: 78px;
    flex-basis: calc(100% - 78px);
  }
  .task-group {
    padding: 12px;
  }
}
</style>
