<template>
  <div v-if="loading && !tasks.length" class="tasks p-2"><el-skeleton :rows="6" animated /></div>
  <scroll-list
    v-else-if="tasks.length"
    ref="scrollList"
    class="flex-1 w-full overflow-y-auto tasks p-2"
    :loading="loading"
    @reach-top="$emit('reach-top')"
  >
    <div v-for="task in tasks" :key="task.id" class="task music-task">
      <music-track
        v-for="(audio, index) in tracks(task)"
        :key="audio.id || `${task.id}-${index}`"
        :title="audio.title || $t('acemusic.track', { number: index + 1 })"
        :track-style="audio.style || task.request?.style || task.request?.prompt"
        :image-url="audio.image_url"
        :duration="audio.duration"
        :model="(audio.model || task.request?.model || '').replace('acemusic-', '')"
        :variation="index + 1"
        :active="currentAudio?.id === audio.id"
        :playing="playing(audio)"
        :playable="playable(audio)"
        :generating="!playable(audio) && !['failed', 'partial_failed', 'submission_unknown'].includes(state(task))"
        @select="select(audio)"
        @play="play(audio)"
        @pause="pause(audio)"
      >
        <template #details>
          <status-badge
            v-if="!playable(audio)"
            :tone="statusTone(audio.state || state(task))"
            density="compact"
            role="status"
          >
            {{ stateLabel(audio.state || state(task)) }}
          </status-badge>
        </template>
        <template #actions>
          <el-tooltip v-if="playable(audio)" :content="$t('acemusic.button.download')" placement="top">
            <button
              type="button"
              class="icon-button icon"
              :disabled="Boolean(downloading)"
              :aria-label="$t('acemusic.button.download')"
              @click.stop="download(audio)"
            >
              <download-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </button>
          </el-tooltip>
          <el-dropdown trigger="click" @click.stop>
            <button type="button" class="icon-button icon" :aria-label="$t('suno.button.more')" @click.stop>
              <more-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="audio.lyric" @click="selectedLyrics = audio">{{
                  $t('acemusic.field.lyric')
                }}</el-dropdown-item>
                <el-dropdown-item v-if="task.request" @click="$emit('reuse', task)">{{
                  $t('acemusic.button.reuse')
                }}</el-dropdown-item>
                <el-dropdown-item v-if="task.request" @click="codeTask = task">{{
                  $t('common.button.viewCode')
                }}</el-dropdown-item>
                <el-dropdown-item @click="detailTask = task">{{ $t('acemusic.button.details') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </music-track>
      <status-badge
        v-if="['partial_failed', 'submission_unknown'].includes(state(task))"
        :tone="statusTone(state(task))"
        density="compact"
        role="status"
      >
        {{ stateLabel(state(task)) }}
      </status-badge>
    </div>
  </scroll-list>
  <div v-else class="w-full flex-1 flex items-center justify-center"><no-tasks /></div>
  <div v-show="Boolean(currentAudio?.object)" class="h-20">
    <player namespace="acemusic" :tracks="playableTracks" />
  </div>
  <el-dialog
    :model-value="Boolean(selectedLyrics)"
    :title="selectedLyrics?.title || $t('acemusic.field.lyric')"
    width="min(640px, 94vw)"
    @close="selectedLyrics = undefined"
  >
    <p class="whitespace-pre-wrap leading-7">{{ selectedLyrics?.lyric }}</p>
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
    <p v-if="detailTask && state(detailTask) === 'partial_failed'" class="mt-3">{{ $t('acemusic.message.partial') }}</p>
  </el-dialog>
  <api-code-dialog
    :visible="Boolean(codeTask)"
    path="/acemusic/audios"
    :body="{ ...codeTask?.request }"
    :token="store.state.acemusic.credential?.token || ''"
    @update:visible="!$event && (codeTask = undefined)"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { StatusBadge } from '@acedatacloud/core/components';
import { DownloadIcon, MoreIcon } from '@acedatacloud/core/icons/components';
import { ElDialog, ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage, ElSkeleton, ElTooltip } from 'element-plus';
import { saveAs } from 'file-saver';
import type { IAcemusicAudio, IAcemusicTask } from '@/models';
import { acemusicTaskState as state, isAcemusicAudioPlayable as playable } from '@/utils/acemusic';
import { t } from '@/i18n';
import ApiCodeDialog from '@/components/common/ApiCodeDialog.vue';
import MusicTrack from '@/components/common/music/MusicTrack.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import Player from '@/components/common/player/Player.vue';
import ScrollList from '@/components/common/ScrollList.vue';

defineProps<{ loading?: boolean }>();
defineEmits<{ 'reach-top': []; reuse: [task: IAcemusicTask] }>();
const store = useStore();
const scrollList = ref<InstanceType<typeof ScrollList>>();
const downloading = ref<string>();
const selectedLyrics = ref<IAcemusicAudio>(),
  detailTask = ref<IAcemusicTask>(),
  codeTask = ref<IAcemusicTask>();
const tasks = computed<IAcemusicTask[]>(() => store.state.acemusic.tasks?.items || []);
const currentAudio = computed(() => store.state.acemusic.audio);
const playableTracks = computed(() => tasks.value.flatMap((task) => task.response?.data || []).filter(playable));
const tracks = (task: IAcemusicTask): IAcemusicAudio[] => {
  const result = Array.isArray(task.response?.data) ? task.response.data : [];
  return (task.request?.action === 'upload' ? [0] : [0, 1]).map(
    (index) =>
      result[index] || {
        id: `${task.id}-${index}`,
        title: task.request?.title,
        state: state(task) === 'partial_failed' ? 'failed' : state(task)
      }
  );
};
const playing = (audio: IAcemusicAudio) =>
  currentAudio.value?.id === audio.id && currentAudio.value?.state === 'playing';
function select(audio: IAcemusicAudio) {
  if (!playable(audio)) return;
  if (currentAudio.value?.id !== audio.id) play(audio);
}
function play(audio: IAcemusicAudio) {
  if (!playable(audio)) return;
  store.dispatch('acemusic/setAudio', {
    ...currentAudio.value,
    ...audio,
    state: 'playing',
    progress: currentAudio.value?.id === audio.id ? currentAudio.value?.progress || 0 : 0
  });
}
function pause(audio: IAcemusicAudio) {
  if (currentAudio.value?.id === audio.id)
    store.dispatch('acemusic/setAudio', { ...currentAudio.value, state: 'paused' });
}
async function download(audio: IAcemusicAudio) {
  if (!playable(audio) || !audio.audio_url || downloading.value) return;
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
function stateLabel(value: string) {
  return t(
    `acemusic.state.${['succeeded', 'partial_failed', 'failed', 'submission_unknown', 'storing'].includes(value) ? value : 'processing'}`
  );
}
function statusTone(value: string): 'success' | 'danger' | 'warning' | 'info' {
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
defineExpose({ getScrollElement: () => scrollList.value?.getScrollElement() });
</script>
