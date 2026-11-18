<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-hidden">
      <el-tabs v-model="mode" class="scenario-tabs scenario-tabs--scrollable">
        <el-tab-pane v-for="tab in modes" :key="tab.name" :label="$t(tab.label)" :name="tab.name">
          <div class="p-5">
            <div v-if="tab.name !== 'upload'" class="mb-4">
              <label class="block text-sm font-bold mb-1" :for="`acemusic-model-${tab.name}`">{{
                $t('acemusic.field.model')
              }}</label>
              <el-select
                :id="`acemusic-model-${tab.name}`"
                v-model="model"
                class="w-full model-select"
                size="default"
                :aria-label="$t('acemusic.field.model')"
              >
                <el-option
                  v-for="item in ['cover', 'mashup'].includes(tab.name) ? ['acemusic-v1.1'] : models"
                  :key="item"
                  :value="item"
                  :label="item"
                />
              </el-select>
            </div>
            <prompt-textarea
              v-if="tab.name === 'idea'"
              v-model="prompt"
              :title="$t('acemusic.field.prompt')"
              :placeholder="$t('acemusic.placeholder.prompt')"
              :min-rows="5"
              :max-rows="14"
              class="mb-4"
            />
            <template v-else-if="tab.name === 'upload'">
              <upload-audio :import-on-select="false" class="mb-4" @uploaded="setUploadUrl" />
              <label class="field-label" for="acemusic-audio-url">{{ $t('acemusic.field.audioUrl') }}</label>
              <el-input id="acemusic-audio-url" v-model="audioUrl" placeholder="https://…" />
              <label class="field-label mt-4" for="acemusic-upload-name">{{ $t('acemusic.field.uploadName') }}</label>
              <el-input id="acemusic-upload-name" v-model="uploadName" />
              <p class="text-xs mt-3 text-[var(--el-text-color-secondary)]">
                {{ $t('acemusic.message.uploadExplicit') }}
              </p>
            </template>
            <template v-else>
              <div v-if="['cover', 'mashup'].includes(tab.name)" class="mb-4">
                <label class="field-label" :for="`acemusic-reference-${tab.name}`">{{
                  $t('acemusic.field.references')
                }}</label>
                <el-select
                  v-if="tab.name === 'cover'"
                  :id="`acemusic-reference-${tab.name}`"
                  v-model="sourceAudio"
                  class="w-full"
                  filterable
                >
                  <el-option
                    v-for="audio in referenceTracks"
                    :key="audio.id"
                    :value="audio.id"
                    :label="referenceLabel(audio)"
                  />
                </el-select>
                <el-select
                  v-else
                  :id="`acemusic-reference-${tab.name}`"
                  v-model="sourceAudios"
                  class="w-full"
                  multiple
                  :multiple-limit="2"
                  filterable
                >
                  <el-option
                    v-for="audio in referenceTracks"
                    :key="audio.id"
                    :value="audio.id"
                    :label="referenceLabel(audio)"
                  />
                </el-select>
                <p class="text-xs mt-2 text-[var(--el-text-color-secondary)]">
                  {{
                    $t(tab.name === 'mashup' ? 'acemusic.message.mashupReferences' : 'acemusic.message.coverReference')
                  }}
                </p>
                <label class="field-label mt-4" :for="`acemusic-audio-influence-${tab.name}`">{{
                  $t('acemusic.field.audioInfluence')
                }}</label>
                <el-slider
                  :id="`acemusic-audio-influence-${tab.name}`"
                  v-model="audioInfluence"
                  :min="1"
                  :max="100"
                  :step="1"
                  :aria-label="$t('acemusic.field.audioInfluence')"
                />
              </div>
              <prompt-textarea
                v-model="lyric"
                :title="$t('acemusic.field.lyric')"
                :placeholder="$t('acemusic.placeholder.lyric')"
                :min-rows="5"
                :max-rows="14"
                class="mb-4"
              >
                <template #actions>
                  <el-button size="small" round @click="lyricsVisible = true">
                    <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
                    {{ $t('acemusic.button.lyrics') }}
                  </el-button>
                </template>
              </prompt-textarea>
              <prompt-textarea
                v-model="style"
                :title="$t('acemusic.field.style')"
                :placeholder="$t('acemusic.placeholder.style')"
                :min-rows="2"
                :max-rows="6"
                class="mb-4"
              />
              <div class="mb-4">
                <label class="block text-sm font-bold mb-1" for="acemusic-title">{{
                  $t('acemusic.field.title')
                }}</label>
                <el-input id="acemusic-title" v-model="title" :placeholder="$t('acemusic.placeholder.title')" />
              </div>
            </template>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div v-if="mode === 'upload'" class="px-5 pb-3 shrink-0">
      <label class="field-label" for="acemusic-upload-anchor">{{ $t('acemusic.field.uploadAnchor') }}</label>
      <el-select id="acemusic-upload-anchor" v-model="sourceAudio" class="w-full" clearable filterable>
        <el-option v-for="audio in referenceTracks" :key="audio.id" :value="audio.id" :label="referenceLabel(audio)" />
      </el-select>
    </div>
    <div v-if="(pendingLyricsSubmission && !writingLyrics) || pendingLyrics" class="px-5 pb-3 shrink-0">
      <div v-if="pendingLyricsSubmission && !writingLyrics" class="lyrics-recovery mb-2">
        <p class="text-xs mb-2">{{ $t('acemusic.message.recover') }}</p>
        <el-button size="small" @click="generateLyrics(true)">{{ $t('acemusic.button.recoverLyrics') }}</el-button>
      </div>
      <div v-if="pendingLyrics" class="lyrics-recovery">
        <p class="text-xs mb-2">{{ $t('acemusic.message.unknown') }}</p>
        <p class="text-xs break-all mb-2">{{ $t('acemusic.field.taskId') }}: {{ pendingLyrics.id }}</p>
        <el-button size="small" :loading="checkingLyrics" @click="checkLyrics">{{
          $t('acemusic.button.checkLyrics')
        }}</el-button>
      </div>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5 gap-2 shrink-0">
      <service-pricing-summary
        :value="generationCost"
        :service="service"
        :note="$t(mode === 'upload' ? 'acemusic.price.upload' : 'acemusic.price.generation')"
      />
      <div class="flex gap-2 w-full">
        <el-button class="flex-1" :disabled="submitting || writingLyrics" @click="clearDraft">
          <cleanup-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('suno.button.clear_all') }}
        </el-button>
        <el-button
          type="primary"
          class="flex-1"
          round
          :loading="submitting"
          :disabled="!valid || Boolean(pendingAudioSubmission)"
          @click="$emit('generate')"
        >
          <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t(mode === 'upload' ? 'acemusic.button.upload' : 'acemusic.button.generate') }}
        </el-button>
      </div>
    </div>
    <el-dialog
      v-model="lyricsVisible"
      :title="$t('acemusic.button.lyrics')"
      width="min(560px, 94vw)"
      :close-on-click-modal="!writingLyrics"
    >
      <label class="field-label" for="acemusic-lyrics-prompt">{{ $t('acemusic.field.prompt') }}</label>
      <el-input
        id="acemusic-lyrics-prompt"
        v-model="lyricsPrompt"
        type="textarea"
        :rows="4"
        :placeholder="$t('acemusic.placeholder.lyricsPrompt')"
      />
      <label class="field-label mt-4" for="acemusic-lyrics-style">{{ $t('acemusic.field.style') }}</label>
      <el-input id="acemusic-lyrics-style" v-model="lyricsStyle" :placeholder="$t('acemusic.placeholder.style')" />
      <p class="text-xs text-[var(--el-text-color-secondary)] mt-3">{{ $t('acemusic.price.lyrics') }}</p>
      <service-pricing-summary :value="lyricsCost" :service="service" />
      <template #footer
        ><el-button
          type="primary"
          :loading="writingLyrics"
          :disabled="!lyricsPrompt.trim() || Boolean(pendingLyrics) || Boolean(pendingLyricsSubmission)"
          @click="generateLyrics()"
          >{{ $t('acemusic.button.lyrics') }}</el-button
        ></template
      >
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { CleanupIcon, MagicIcon } from '@acedatacloud/core/icons/components';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { ElButton, ElDialog, ElInput, ElMessage, ElOption, ElSelect, ElSlider, ElTabPane, ElTabs } from 'element-plus';
import { ACEMUSIC_MODELS } from '@/constants';
import type { AcemusicModel, IAcemusicAudio, IAcemusicConfig } from '@/models';
import { acemusicOperator, buildAcemusicAudioRequest, isAcemusicRequestValid } from '@/operators/acemusic';
import { ensureLoggedIn, getConsumption } from '@/utils';
import { t } from '@/i18n';
import {
  pendingAcemusicSubmission,
  prepareAcemusicSubmission,
  settleAcemusicSubmission,
  isDefiniteAcemusicRejection
} from '@/utils/acemusicSubmission';
import ServicePricingSummary from '@/components/common/ServicePricingSummary.vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import UploadAudio from '@/components/suno/config/UploadAudio.vue';
import { isAcemusicAudioPlayable } from '@/utils/acemusic';

defineProps<{ submitting: boolean }>();
defineEmits<{ generate: [] }>();
const store = useStore();
const models = ACEMUSIC_MODELS;
const modes = [
  { name: 'idea', label: 'acemusic.mode.idea' },
  { name: 'custom', label: 'acemusic.mode.custom' },
  { name: 'upload', label: 'acemusic.mode.upload' },
  { name: 'cover', label: 'acemusic.mode.cover' },
  { name: 'mashup', label: 'acemusic.mode.mashup' }
];
const config = computed<IAcemusicConfig>(
  () => store.state.acemusic.config || { model: 'acemusic-v1.1', custom: false }
);
const patch = (value: Partial<IAcemusicConfig>) => store.commit('acemusic/setConfig', { ...config.value, ...value });
const field = (key: 'prompt' | 'lyric' | 'style' | 'title' | 'audio_url' | 'name') =>
  computed({ get: () => config.value[key] || '', set: (value: string) => patch({ [key]: value }) });
const prompt = field('prompt'),
  lyric = field('lyric'),
  style = field('style'),
  title = field('title'),
  audioUrl = field('audio_url'),
  uploadName = field('name');
const mode = computed({
  get: () =>
    config.value.action && config.value.action !== 'generate'
      ? config.value.action
      : config.value.custom
        ? 'custom'
        : 'idea',
  set: (value: string) =>
    patch({
      action: ['idea', 'custom'].includes(value) ? 'generate' : (value as IAcemusicConfig['action']),
      custom: value === 'custom',
      ...(['cover', 'mashup'].includes(value) ? { model: 'acemusic-v1.1' as const } : {})
    })
});
const model = computed({ get: () => config.value.model, set: (value: AcemusicModel) => patch({ model: value }) });
const service = computed(() => store.state.acemusic.service);
const request = computed(() => buildAcemusicAudioRequest(config.value));
const valid = computed(() => isAcemusicRequestValid(request.value));
const referenceTracks = computed<IAcemusicAudio[]>(() =>
  (store.state.acemusic.tasks?.items || [])
    .flatMap((task: any) => task.response?.data || [])
    .filter(isAcemusicAudioPlayable)
);
const referenceLabel = (audio: IAcemusicAudio) =>
  `${audio.title || audio.id.slice(0, 8)} · ${audio.duration ? Math.round(audio.duration) + 's · ' : ''}${audio.id.slice(0, 8)}`;
const sourceAudio = computed({
  get: () => config.value.audio_id || '',
  set: (value: string) => patch({ audio_id: value || undefined })
});
const sourceAudios = computed({
  get: () => config.value.mashup_audio_ids || [],
  set: (value: string[]) => patch({ mashup_audio_ids: value })
});
const audioInfluence = computed({
  get: () => config.value.audio_influence ?? 60,
  set: (value: number) => patch({ audio_influence: value })
});
const setUploadUrl = (value: string) => patch({ audio_url: value });
const generationCost = computed(() =>
  service.value?.cost?.length ? getConsumption(request.value, service.value.cost) : undefined
);
const lyricsCost = computed(() =>
  service.value?.cost?.length ? getConsumption({ action: 'lyrics' }, service.value.cost) : undefined
);
const pendingAudioSubmission = computed(() => pendingAcemusicSubmission(store, 'audios'));
const pendingLyricsSubmission = computed(() => pendingAcemusicSubmission(store, 'lyrics'));
const pendingLyrics = computed(() => {
  const task = store.state.acemusic.lyricsTask;
  return task && task.userId === store.state.user?.id && task.applicationId === store.state.acemusic.application?.id
    ? task
    : undefined;
});
const checkingLyrics = ref(false);
const lyricsVisible = ref(false),
  writingLyrics = ref(false),
  lyricsPrompt = ref(''),
  lyricsStyle = ref('');
function clearDraft() {
  store.commit('acemusic/setConfig', {
    model: config.value.model,
    custom: false,
    prompt: '',
    lyric: '',
    style: '',
    title: ''
  });
  lyricsPrompt.value = '';
  lyricsStyle.value = '';
}
async function generateLyrics(recover = false) {
  if (
    writingLyrics.value ||
    pendingLyrics.value ||
    (!recover && (pendingLyricsSubmission.value || !lyricsPrompt.value.trim())) ||
    !ensureLoggedIn()
  )
    return;
  const token = store.state.acemusic.credential?.token;
  if (!token || !store.state.user?.id || !store.state.acemusic.application?.id) {
    ElMessage.warning(t('acemusic.message.credential'));
    return;
  }
  const submission = prepareAcemusicSubmission(store, 'lyrics', {
    prompt: lyricsPrompt.value.trim(),
    style: lyricsStyle.value.trim() || undefined
  });
  writingLyrics.value = true;
  try {
    const { data } = await acemusicOperator.lyrics(submission.request as { prompt: string; style?: string }, {
      token,
      idempotencyKey: submission.key
    });
    if (data.task_id || data.success === true) settleAcemusicSubmission(store, submission);
    if (token !== store.state.acemusic.credential?.token) return;
    const result = data.data?.[0];
    if (data.success !== true || !result?.text) {
      if (data.task_id && data.success !== false) {
        store.commit('acemusic/setLyricsTask', {
          id: data.task_id,
          userId: store.state.user?.id,
          applicationId: store.state.acemusic.application?.id
        });
        lyricsVisible.value = false;
        return;
      }
      throw new Error(t('acemusic.message.lyricsFailed'));
    }
    patch({
      custom: true,
      lyric: result.text,
      title: result.title || title.value,
      style: submission.request.style || style.value
    });
    lyricsVisible.value = false;
  } catch (error: any) {
    if (error?.response?.data?.task_id || isDefiniteAcemusicRejection(error))
      settleAcemusicSubmission(store, submission);
    else lyricsVisible.value = false;
    ElMessage.error(t('acemusic.message.lyricsFailed'));
  } finally {
    writingLyrics.value = false;
  }
}
async function checkLyrics() {
  const taskId = pendingLyrics.value?.id,
    token = store.state.acemusic.credential?.token;
  if (!taskId || !token || checkingLyrics.value) return;
  checkingLyrics.value = true;
  try {
    const { data } = await acemusicOperator.task<{
      state?: string;
      status?: string;
      response?: { success?: boolean; data?: Array<{ title?: string; text?: string }> };
    }>(taskId, { token });
    if (token !== store.state.acemusic.credential?.token || pendingLyrics.value?.id !== taskId) return;
    const result = data.response?.data?.[0];
    if (data.response?.success === true && result?.text) {
      patch({ custom: true, lyric: result.text, title: result.title || title.value });
      store.commit('acemusic/setLyricsTask', undefined);
    } else if (data.state === 'failed' || data.status === 'failed' || data.response?.success === false) {
      store.commit('acemusic/setLyricsTask', undefined);
      ElMessage.error(t('acemusic.message.lyricsFailed'));
    } else ElMessage.info(t('acemusic.message.unknown'));
  } catch {
    ElMessage.error(t('acemusic.message.lyricsFailed'));
  } finally {
    checkingLyrics.value = false;
  }
}
</script>
<style scoped>
.lyrics-recovery {
  padding: 10px;
  background: var(--el-color-warning-light-9);
  border-radius: 8px;
}
.field-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}
</style>
