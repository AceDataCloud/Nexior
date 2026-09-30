<template>
  <div class="task">
    <div v-if="isFailure || isPending" class="audio placeholder-row" :class="{ 'failed-row': isFailure }">
      <div class="left placeholder-cover" :class="{ 'pending-cover': isPending }">
        <music-icon :size="'24' as any" aria-hidden="true" focusable="false" />
        <span v-if="isFailure" class="cover-status">
          <warning-icon :size="'12' as any" aria-hidden="true" focusable="false" />
        </span>
      </div>
      <div class="info">
        <div class="title-row">
          <h2 class="title">{{ placeholderTitle }}</h2>
          <meta-tag v-if="placeholderModel" class="model-chip" tone="brand" density="compact">{{
            placeholderModel
          }}</meta-tag>
        </div>
        <p class="style">{{ placeholderDescription }}</p>
        <status-badge class="task-status" :tone="isFailure ? 'danger' : 'info'" density="compact" role="status">
          {{ $t(isFailure ? 'suno.name.failure' : 'suno.name.generating') }}
        </status-badge>
      </div>
      <div v-if="isFailure" class="placeholder-actions">
        <el-tooltip :content="$t('suno.button.reuse_prompt')">
          <button
            type="button"
            class="icon-button"
            :aria-label="$t('suno.button.reuse_prompt')"
            @click="onReusePrompt({})"
          >
            <undo-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </button>
        </el-tooltip>
        <el-popover trigger="click" placement="bottom-end" :width="320">
          <template #reference>
            <button type="button" class="icon-button" :aria-label="$t('suno.button.failureDetails')">
              <info-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </button>
          </template>
          <div class="suno-failure-details">
            <p v-if="failureReason">
              {{ $t('suno.name.failureReason') }}: {{ failureReason }} <copy-to-clipboard :content="failureReason" />
            </p>
            <p>{{ $t('suno.name.taskId') }}: {{ modelValue.id }} <copy-to-clipboard :content="modelValue.id" /></p>
            <p v-if="traceId">{{ $t('suno.name.traceId') }}: {{ traceId }} <copy-to-clipboard :content="traceId" /></p>
          </div>
        </el-popover>
      </div>
    </div>
    <div
      v-for="(audio, index) in audios"
      :key="audio.id"
      class="audio"
      :class="{
        'mashup-selected': isMashupSelected(audio),
        active: $store.state?.suno?.audio?.id === audio.id,
        generating: !audio?.audio_url
      }"
      @click.stop="onClick(audio)"
    >
      <!-- Mashup selection checkbox -->
      <div v-if="isMashupMode && audio?.audio_url" class="mashup-check" @click.stop="onToggleMashup(audio)">
        <el-checkbox :model-value="isMashupSelected(audio)" @click.stop />
      </div>
      <div v-loading="!audio?.audio_url" class="left">
        <el-image :src="audio?.image_url" class="cover" fit="cover" lazy />
        <!-- Variation index — one generation returns 2 songs; label them so they don't read as duplicates -->
        <div v-if="audios.length > 1" class="variation-badge">{{ index + 1 }}</div>
        <!-- Always-visible play/pause control (hover-only was invisible on touch) -->
        <div
          v-if="
            audio?.audio_url &&
            $store.state?.suno?.audio?.id === audio.id &&
            $store.state?.suno?.audio?.state === 'playing'
          "
          class="play-btn"
          role="button"
          tabindex="0"
          :aria-label="$t('common.player.pause')"
          :title="$t('common.player.pause')"
          @click.stop="onPause(audio)"
          @keydown.enter.stop.prevent="onPause(audio)"
          @keydown.space.stop.prevent="onPause(audio)"
        >
          <el-icon><video-pause :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
        </div>
        <div
          v-else-if="audio?.audio_url"
          class="play-btn"
          role="button"
          tabindex="0"
          :aria-label="$t('common.player.play')"
          :title="$t('common.player.play')"
          @click.stop="onPlay(audio)"
          @keydown.enter.stop.prevent="onPlay(audio)"
          @keydown.space.stop.prevent="onPlay(audio)"
        >
          <el-icon><video-play :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
        </div>
        <div v-if="audio?.duration" class="duration">
          {{ useFormatDuring(audio?.duration) }}
        </div>
      </div>
      <div class="info">
        <!-- Inline title editing -->
        <div v-if="editingAudioId === audio.id" class="title-edit" @click.stop>
          <el-input
            ref="titleInput"
            v-model="editingTitle"
            size="small"
            @keyup.enter="onSaveTitleEdit(audio)"
            @keyup.escape="onCancelTitleEdit"
            @blur="onSaveTitleEdit(audio)"
          />
        </div>
        <div v-else class="title-row">
          <h2 class="title">{{ audio?.title }}</h2>
          <meta-tag v-if="shortModel(audio)" class="model-chip" tone="brand" density="compact">{{
            shortModel(audio)
          }}</meta-tag>
          <button
            v-if="audio?.audio_url"
            type="button"
            class="icon-button edit-icon"
            :aria-label="$t('common.button.edit')"
            :title="$t('common.button.edit')"
            @click.stop="onStartTitleEdit(audio)"
          >
            <edit-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </button>
        </div>
        <p class="style">{{ audio?.style }}</p>
        <!-- Generation progress bar -->
        <div v-if="!audio?.audio_url && audio?.progress != null && audio?.progress < 100" class="progress-row">
          <el-progress
            :percentage="Math.round(audio.progress)"
            :stroke-width="4"
            :show-text="false"
            status="warning"
            class="progress-bar"
          />
          <span class="progress-text">{{ $t('suno.name.generating') }} {{ Math.round(audio.progress) }}%</span>
        </div>
      </div>
      <div class="right">
        <!-- Quick Extend — the most common re-use action, surfaced out of the "…" menu -->
        <el-tooltip v-if="audio?.audio_url" effect="dark" :content="$t('suno.button.extend')" placement="top">
          <button
            type="button"
            class="icon-button icon icon-extend"
            :aria-label="$t('suno.button.extend')"
            :title="$t('suno.button.extend')"
            @click.stop="onExtend($event, audio)"
          >
            <fast-forward-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </button>
        </el-tooltip>
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-tooltip effect="dark" :content="$t('common.button.download')" placement="top">
              <download-icon
                v-if="audio?.audio_url || audio?.video_url"
                class="icon icon-download"
                :size="'1em' as any"
                aria-hidden="true"
                focusable="false"
              />
            </el-tooltip>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :disabled="isFetchingVideoUrl" @click="handleVideoDownload(audio)">
                <div class="flex items-center min-w-[120px]">
                  <el-icon v-if="isFetchingVideoUrl" class="is-loading mr-2">
                    <Loading :size="'1em' as any" aria-hidden="true" focusable="false" />
                  </el-icon>
                  <span>{{ $t('suno.button.download_video') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.audio_url" @click.stop="onDownload($event, audio?.audio_url)">
                {{ $t('suno.button.download_audio') }}
              </el-dropdown-item>
              <el-dropdown-item :disabled="isFetchingWav" @click="handleWavDownload(audio)">
                <div class="flex items-center min-w-[120px]">
                  <el-icon v-if="isFetchingWav" class="is-loading mr-2">
                    <Loading :size="'1em' as any" aria-hidden="true" focusable="false" />
                  </el-icon>
                  <span>{{ $t('suno.button.download_wav') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item :disabled="isFetchingMidi" @click="handleMidiDownload(audio)">
                <div class="flex items-center min-w-[120px]">
                  <el-icon v-if="isFetchingMidi" class="is-loading mr-2">
                    <Loading :size="'1em' as any" aria-hidden="true" focusable="false" />
                  </el-icon>
                  <span>{{ $t('suno.button.download_midi') }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-tooltip effect="dark" :content="$t('suno.button.more')" placement="top">
              <more-icon
                v-if="audio?.audio_url || audio?.video_url"
                class="icon icon-ellipsis"
                :size="'1em' as any"
                aria-hidden="true"
                focusable="false"
              />
            </el-tooltip>
          </span>
          <template #dropdown>
            <el-dropdown-menu class="suno-action-menu">
              <!-- Creation group -->
              <el-dropdown-item v-if="audio?.audio_url" @click.stop="onExtend($event, audio)">
                <fast-forward-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.extend') }}
              </el-dropdown-item>
              <el-dropdown-item @click.stop="onCover(audio)">
                <music-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.cover_music') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onMashup(audio)">
                <shuffle-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.mashup') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id && audio?.action === 'extend'" @click.stop="onConcatMusic(audio?.id)">
                <link-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.concat_music') }}
              </el-dropdown-item>

              <!-- Editing group -->
              <div class="menu-divider" />
              <el-dropdown-item v-if="audio?.id" @click.stop="onReplaceSection(audio)">
                <cut-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.replace_section') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onOverpainting(audio)">
                <microphone-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.overpainting') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onUnderpainting(audio)">
                <guitar-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.underpainting') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onSamples(audio)">
                <drum-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.samples') }}
              </el-dropdown-item>

              <!-- Processing group -->
              <div class="menu-divider" />
              <el-dropdown-item v-if="audio.id" @click.stop="onGetStems(audio.id)">
                <collection-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.get_stems') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio.id" @click.stop="onGetAllStems(audio.id)">
                <sort-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.all_stems') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onRemaster(audio)">
                <magic-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.remaster') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onExtractVocals(audio)">
                <audio-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.extract_vocals') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onArtistConsistency(audio)">
                <palette-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.artist_consistency') }}
              </el-dropdown-item>

              <el-dropdown-item v-if="audio?.id" @click.stop="onArtistConsistencyVox(audio)">
                <microphone-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.artist_consistency_vox') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onCreatePersona(audio)">
                <microphone-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.create_persona') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.audio_url" @click.stop="onInspire(audio)">
                <magic-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.inspo') }}
              </el-dropdown-item>

              <!-- Utility group -->
              <div class="menu-divider" />
              <el-dropdown-item @click.stop="onReusePrompt(audio)">
                <undo-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.reuse_prompt') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" :disabled="isFetchingTiming" @click.stop="onGetTiming(audio)">
                <time-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('suno.button.get_timing') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="showViewCode" @click.stop="onViewCode">
                <code-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('common.button.viewCode') }}
              </el-dropdown-item>

              <el-dropdown-item v-if="audio?.id" @click.stop="onReport(audio)">
                <warning-icon class="menu-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />

                {{ $t('common.button.report') }}
              </el-dropdown-item>

              <!-- Delete group -->
              <div class="menu-divider" />
              <el-dropdown-item v-if="audio?.id" class="delete-item" @click.stop="onDelete(audio)">
                <delete-icon class="menu-icon delete-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ $t('common.button.delete') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <timing-dialog v-model="timingVisible" :audio="timingAudio" :data="timingData" />
    <vocal-dialog v-model="vocalVisible" :audio="sourceAudio" />
    <voice-create-dialog
      v-model="voiceVisible"
      :source-audio="sourceAudio"
      @created="$store.dispatch('suno/getPersonas')"
    />
    <api-code-dialog
      v-model:visible="apiCodeVisible"
      method="POST"
      :path="apiCodePath"
      :body="apiCodeBody"
      :token="$store.state.suno?.credential?.token || ''"
    />
    <report-dialog
      v-model:visible="reportVisible"
      service="suno"
      :target-id="reportTargetId"
      :snapshot="reportSnapshot"
    />
  </div>
</template>

<script lang="ts">
import { MetaTag, StatusBadge } from '@acedatacloud/core/components';
import {
  AudioIcon,
  CodeIcon,
  CollectionIcon,
  CutIcon,
  DeleteIcon,
  DownloadIcon,
  DrumIcon,
  EditIcon,
  FastForwardIcon,
  GuitarIcon,
  InfoIcon,
  LinkIcon,
  LoadingIcon as Loading,
  MagicIcon,
  MicrophoneIcon,
  MoreIcon,
  MusicIcon,
  PaletteIcon,
  ShuffleIcon,
  SortIcon,
  TimeIcon,
  UndoIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { useFormatDuring } from '@/utils/number';
import { ISunoAudio, ISunoTask, ISunoConfig } from '@/models';
import {
  ElImage,
  ElIcon,
  ElTooltip,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElMessage,
  ElInput,
  ElMessageBox,
  ElProgress,
  ElCheckbox,
  ElPopover
} from 'element-plus';

import { PauseIcon as VideoPause, PlayIcon as VideoPlay } from '@acedatacloud/core/icons/components';
import { ISunoMp4Request, ISunoAudioRequest, Status } from '@/models';
import { saveAs } from 'file-saver';
import { sunoOperator } from '@/operators/suno';
import { sunoPaymentOptions } from '@/utils/x402/sunoPayment';
import { X402PaymentCancelledError } from '@/operators/x402';
import ApiCodeDialog from '@/components/common/ApiCodeDialog.vue';
import ReportDialog from '@/components/common/ReportDialog.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { isMainOfficial } from '@/utils';
import { hasExplicitTaskFailure } from '@/store/factories/taskPolling';
import { openTaskDrawer } from '@/utils/taskDrawerMixin';
import { encodeSunoMidi } from '@/utils/suno/midi';
import { clearSunoOperation } from '@/utils/suno/operation';
import TimingDialog from './TimingDialog.vue';
import VocalDialog from './VocalDialog.vue';
import VoiceCreateDialog from '../voice/VoiceCreateDialog.vue';
export default defineComponent({
  name: 'TaskPreview',
  components: {
    MetaTag,
    StatusBadge,
    AudioIcon,
    CodeIcon,
    CollectionIcon,
    CutIcon,
    DeleteIcon,
    DownloadIcon,
    DrumIcon,
    EditIcon,
    FastForwardIcon,
    GuitarIcon,
    InfoIcon,
    LinkIcon,
    MagicIcon,
    MicrophoneIcon,
    MoreIcon,
    MusicIcon,
    PaletteIcon,
    ShuffleIcon,
    SortIcon,
    TimeIcon,
    UndoIcon,
    WarningIcon,
    ElImage,
    ElIcon,
    ElTooltip,
    VideoPlay,
    VideoPause,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElInput,
    ElProgress,
    ElCheckbox,
    ElPopover,
    Loading,
    ApiCodeDialog,
    ReportDialog,
    CopyToClipboard,
    TimingDialog,
    VocalDialog,
    VoiceCreateDialog
  },
  props: {
    modelValue: {
      type: Object as () => ISunoTask,
      required: true
    }
  },
  emits: ['wallet-task'],
  data() {
    return {
      isFetchingVideoUrl: false,
      isFetchingWav: false,
      isFetchingMidi: false,
      isFetchingTiming: false,
      timingVisible: false,
      timingData: undefined as unknown,
      timingAudio: {} as ISunoAudio,
      vocalVisible: false,
      voiceVisible: false,
      sourceAudio: {} as ISunoAudio,
      editingAudioId: null as string | null,
      editingTitle: '',
      apiCodeVisible: false,
      reportVisible: false,
      reportTargetId: '',
      reportSnapshot: undefined as Record<string, unknown> | undefined,
      apiCodePath: '/suno/audios',
      apiCodeBody: {} as Record<string, unknown>
    };
  },
  computed: {
    loading() {
      return this.$store.state.suno?.status?.getApplications === Status.Request;
    },
    showViewCode(): boolean {
      return isMainOfficial();
    },
    credential() {
      return this.$store.state.suno.credential;
    },
    config() {
      return this.$store.state.suno.config;
    },
    task() {
      return this.$store.state.suno?.tasks;
    },
    audios(): ISunoAudio[] {
      const result = this.modelValue?.response?.data;
      const data = (Array.isArray(result) ? result : []) as ISunoAudio[];
      // @ts-ignore
      const action = this.modelValue?.request?.action as ISunoAudio['action'] | undefined;
      return action ? data.map((a) => ({ ...a, action })) : data;
    },
    isFailure(): boolean {
      return this.audios.length === 0 && hasExplicitTaskFailure(this.modelValue);
    },
    isPending(): boolean {
      return this.audios.length === 0 && !this.isFailure && !this.modelValue.response;
    },
    placeholderTitle(): string {
      const request = this.modelValue.request as ISunoAudioRequest | undefined;
      return request?.title || this.$t('suno.name.untitledSong');
    },
    placeholderDescription(): string {
      const request = this.modelValue.request as ISunoAudioRequest | undefined;
      return request?.style || request?.prompt || request?.lyric_prompt || this.$t('suno.message.songPlaceholder');
    },
    placeholderModel(): string {
      return this.shortModel({ model: (this.modelValue.request as ISunoAudioRequest | undefined)?.model });
    },
    failureReason(): string | undefined {
      const error = this.modelValue?.response?.error;
      return typeof error === 'string' ? error : error?.message;
    },
    traceId(): string | undefined {
      return this.modelValue?.response?.trace_id || this.modelValue?.trace_id;
    },
    application() {
      return this.$store.state.suno?.application;
    },
    active() {
      return this.$store.state.suno?.tasks?.active;
    },
    isMashupMode(): boolean {
      return this.$store.state.suno?.config?.action === 'mashup';
    },
    mashupAudioIds(): string[] {
      return this.$store.state.suno?.config?.mashup_audio_ids || [];
    }
  },
  methods: {
    setOperation(config: ISunoConfig) {
      this.$store.commit('suno/setConfig', config);
      if (window.matchMedia('(max-width: 767px)').matches) openTaskDrawer();
    },
    onReport(audio: any) {
      this.reportTargetId = audio?.id || '';
      this.reportSnapshot = { prompt: audio?.prompt, title: audio?.title };
      this.reportVisible = true;
    },
    useFormatDuring,
    shortModel(audio: ISunoAudio): string {
      // "chirp-v5-5" -> "v5.5", "chirp-v3-0" -> "v3" (matches the model selector labels)
      const m = audio?.model;
      if (!m) return '';
      const match = /v(\d+)(?:-(\d+))?(-plus)?/i.exec(m);
      if (!match) return m;
      if (m === 'chirp-v6-wild') return 'v6 Wild';
      if (m === 'chirp-v6-mini') return 'v6 Mini';
      const minor = match[2] && match[2] !== '0' ? '.' + match[2] : '';
      return `v${match[1]}${minor}${match[3] ? '+' : ''}`;
    },
    onViewCode() {
      const request = (this.modelValue?.request || {}) as Record<string, unknown>;
      const body: Record<string, unknown> = {};
      Object.entries(request).forEach(([k, v]) => {
        if (k === 'application_id' || k === 'callback_url') return;
        if (v === undefined || v === null) return;
        if (typeof v === 'string' && v === '') return;
        if (Array.isArray(v) && v.length === 0) return;
        body[k] = v;
      });
      this.apiCodeBody = body;
      this.apiCodePath = '/suno/audios';
      this.apiCodeVisible = true;
    },
    onPlay(audio: ISunoAudio) {
      this.$store.dispatch('suno/setAudio', {
        ...this.$store.state.suno.audio,
        ...audio,
        state: 'playing'
      });
    },
    onPause(audio: ISunoAudio) {
      this.$store.dispatch('suno/setAudio', {
        ...this.$store.state.suno.audio,
        ...audio,
        state: 'paused'
      });
    },
    onClick(audio: ISunoAudio) {
      if (!audio.audio_url) return;
      if (this.$store.state?.suno?.audio?.id !== audio.id) {
        this.onPlay({
          ...audio,
          progress: 0
        });
      }
    },
    onExtend(event: MouseEvent, audio: ISunoAudio) {
      event?.stopPropagation();
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        instrumental: false,
        style: audio.style,
        action: 'extend',
        audio: audio,
        audio_id: audio.id,
        continue_at: audio.duration
      });
    },
    onDownload(event: MouseEvent | null, audioUrl: string) {
      if (event) {
        event?.stopPropagation();
      }
      const parsedUrl = new URL(audioUrl);
      const pathname = parsedUrl.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      fetch(audioUrl)
        .then((response) => response.blob())
        .then((blob) => {
          saveAs(blob, filename);
        });
      // download url here
      // window.open(audioUrl, '_blank');
    },
    async handleVideoDownload(audio: ISunoAudio) {
      if (audio.video_url) {
        this.onDownload(null, audio.video_url);
        return;
      }
      if (this.isFetchingVideoUrl) {
        return;
      }
      try {
        this.isFetchingVideoUrl = true;
        // @ts-ignore
        const videoUrl = await this.fetchVideoUrlFromApi(audio?.id);
        audio.video_url = videoUrl;
        this.onDownload(null, videoUrl);
      } catch (error) {
        console.error('get videoUrl failed:', error);
        ElMessage.error(this.$t('suno.message.getVideoUrlFailed'));
      } finally {
        this.isFetchingVideoUrl = false;
      }
    },
    async fetchVideoUrlFromApi(audioId: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const request = {
          audio_id: audioId
        } as ISunoMp4Request;
        const token = this.credential?.token;
        if (!token) {
          console.error('no token specified');
          reject(new Error('No token specified'));
          return;
        }
        sunoOperator
          .mp4(request, { token })
          .then((response) => {
            const videoUrl = response.data?.data?.video_url;
            if (videoUrl) {
              resolve(videoUrl);
            } else {
              reject(new Error('Video URL not found in response'));
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    onPreview(event: MouseEvent, videoUrl: string) {
      event?.stopPropagation();
      window.open(videoUrl, '_blank');
    },
    async onGetStems(audioId: string) {
      await this.onGenerateAudioUrl('stems', audioId);
    },
    onCover(audio: ISunoAudio) {
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        instrumental: false,
        style: audio.style,
        action: 'cover',
        audio: audio,
        audio_id: audio.id
      });
    },
    async onConcatMusic(audioId: string) {
      await this.onGenerateAudioUrl('concat', audioId);
    },
    onRemaster(audio: ISunoAudio) {
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno.config),
        action: 'remaster',
        audio,
        audio_id: audio.id,
        model: audio.model,
        custom: true,
        variation_category: 'normal'
      });
    },
    async onGetAllStems(audioId: string) {
      await this.onGenerateAudioUrl('all_stems', audioId);
    },
    onReplaceSection(audio: ISunoAudio) {
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        instrumental: false,
        style: audio.style,
        action: 'replace_section',
        audio: audio,
        audio_id: audio.id,
        replace_section_start: 0,
        replace_section_end: Math.min(30, audio.duration || 30)
      });
    },
    onMashup(audio: ISunoAudio) {
      if (!audio.id) return;
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'mashup',
        audio: audio,
        audio_id: audio.id,
        mashup_audio_ids: [audio.id]
      });
    },
    onOverpainting(audio: ISunoAudio) {
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'overpainting',
        audio: audio,
        audio_id: audio.id,
        overpainting_start: 0,
        overpainting_end: Math.min(30, audio.duration || 30)
      });
    },
    onUnderpainting(audio: ISunoAudio) {
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'underpainting',
        audio: audio,
        audio_id: audio.id,
        underpainting_start: 0,
        underpainting_end: Math.min(30, audio.duration || 30)
      });
    },
    onSamples(audio: ISunoAudio) {
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'samples',
        audio: audio,
        audio_id: audio.id,
        samples_start: 0,
        samples_end: Math.min(30, audio.duration || 30)
      });
    },
    onArtistConsistency(audio: ISunoAudio) {
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno?.config),
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'artist_consistency',
        audio: audio,
        audio_id: audio.id
      });
    },
    onReusePrompt(audio: ISunoAudio) {
      const req = (this.modelValue?.request ?? {}) as ISunoAudioRequest;
      const hasContent =
        req.prompt ||
        req.lyric ||
        req.style ||
        req.title ||
        req.lyric_prompt ||
        req.negative_tags ||
        req.style_negative ||
        req.persona_id;
      if (!hasContent) {
        ElMessage.warning(this.$t('suno.message.reusePromptEmpty'));
        return;
      }
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
        model: req.model ?? audio.model,
        custom: req.custom ?? false,
        instrumental: req.instrumental ?? false,
        prompt: req.prompt ?? '',
        lyric: req.lyric ?? '',
        lyric_prompt: req.lyric_prompt ?? '',
        lyrics_mode: req.lyrics_mode ?? 'manual',
        title: req.title ?? '',
        style: req.style ?? '',
        negative_tags: req.negative_tags ?? req.style_negative ?? '',
        vocal_gender: req.vocal_gender,
        weirdness: req.weirdness,
        style_influence: req.style_influence,
        variation_category: req.variation_category,
        audio_weight: req.audio_weight,
        duration: req.duration,
        persona_id: req.persona_id,
        custom_model_id: undefined,
        audio_urls: undefined,
        // reset to a fresh generation
        action: undefined,
        audio: undefined,
        audio_id: undefined,
        mashup_audio_ids: undefined,
        continue_at: undefined,
        speed: undefined,
        replace_section_start: undefined,
        replace_section_end: undefined,
        overpainting_start: undefined,
        overpainting_end: undefined,
        underpainting_start: undefined,
        underpainting_end: undefined,
        samples_start: undefined,
        samples_end: undefined
      });
      if (window.matchMedia('(max-width: 767px)').matches) openTaskDrawer();
      ElMessage.success(this.$t('suno.message.reusePromptSuccess'));
    },
    onExtractVocals(audio: ISunoAudio) {
      this.sourceAudio = audio;
      this.vocalVisible = true;
    },
    onCreatePersona(audio: ISunoAudio) {
      this.sourceAudio = audio;
      this.voiceVisible = true;
    },
    async onGetTiming(audio: ISunoAudio) {
      if (!audio.id || this.isFetchingTiming) return;
      const options = sunoPaymentOptions(this);
      if (!options) return;
      this.isFetchingTiming = true;
      try {
        const response = await sunoOperator.timing({ audio_id: audio.id }, options);
        if (response.data.success === false) throw new Error('Timing failed');
        this.timingData = response.data.data;
        this.timingAudio = audio;
        this.timingVisible = true;
      } catch (error) {
        if (error instanceof X402PaymentCancelledError) return;
        ElMessage.error(this.$t('suno.message.fetchTimingFailed'));
      } finally {
        this.isFetchingTiming = false;
      }
    },
    async handleWavDownload(audio: ISunoAudio) {
      if (!audio?.id || this.isFetchingWav) return;
      const options = sunoPaymentOptions(this);
      if (!options) return;
      try {
        this.isFetchingWav = true;
        ElMessage.info(this.$t('suno.message.fetchingWav'));
        const response = await sunoOperator.wav({ audio_id: audio.id }, options);
        // Worker returns `data: [{ file_url }]` (array, not an object).
        const wavUrl = response.data?.data?.[0]?.file_url;
        if (wavUrl) {
          this.onDownload(null, wavUrl);
        } else {
          ElMessage.error(this.$t('suno.message.fetchWavFailed'));
        }
      } catch (error) {
        if (error instanceof X402PaymentCancelledError) return;
        const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message;
        ElMessage.error(message || this.$t('suno.message.fetchWavFailed'));
      } finally {
        this.isFetchingWav = false;
      }
    },
    async handleMidiDownload(audio: ISunoAudio) {
      if (!audio?.id || this.isFetchingMidi) return;
      const options = sunoPaymentOptions(this);
      if (!options) return;
      try {
        this.isFetchingMidi = true;
        ElMessage.info(this.$t('suno.message.fetchingMidi'));
        const response = await sunoOperator.midi({ audio_id: audio.id }, options);
        const bytes = encodeSunoMidi(response.data?.data || []);
        const filename = (audio.title || audio.id || 'suno').replace(/[/\\:*?"<>|]+/g, '_') + '.mid';
        saveAs(new Blob([bytes], { type: 'audio/midi' }), filename);
      } catch (error) {
        if (error instanceof X402PaymentCancelledError) return;
        const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message;
        ElMessage.error(message || this.$t('suno.message.fetchMidiFailed'));
      } finally {
        this.isFetchingMidi = false;
      }
    },
    async onGenerateAudioUrl(action: string, audioId: string) {
      const request = {
        action,
        audio_id: audioId,
        async: true
      } as ISunoAudioRequest;
      const options = sunoPaymentOptions(this);
      if (!options) return;
      ElMessage.info(this.$t('suno.message.startingTask'));
      sunoOperator
        .audio(request, options)
        .then((response) => {
          const taskId = response?.data?.task_id;
          if (taskId) this.$emit('wallet-task', taskId);
          ElMessage.success(this.$t('suno.message.startTaskSuccess'));
        })
        .catch((error) => {
          if (error instanceof X402PaymentCancelledError) return;
          ElMessage.error(error?.response?.data?.error?.message || this.$t('suno.message.startTaskFailed'));
        })
        .finally(async () => {
          await this.onGetTasks();
          await this.onScrollDown();
        });
    },
    isMashupSelected(audio: ISunoAudio): boolean {
      return !!audio.id && this.mashupAudioIds.includes(audio.id);
    },
    onToggleMashup(audio: ISunoAudio) {
      if (!audio.id) return;
      const ids = [...this.mashupAudioIds];
      const idx = ids.indexOf(audio.id);
      if (idx !== -1) {
        ids.splice(idx, 1);
      } else {
        if (ids.length >= 2) {
          ElMessage.warning(this.$t('suno.message.mashupReferencesRequired'));
          return;
        }
        ids.push(audio.id);
      }
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
        mashup_audio_ids: ids
      });
    },
    onArtistConsistencyVox(audio: ISunoAudio) {
      this.onArtistConsistency(audio);
      this.$store.commit('suno/setConfig', { ...this.$store.state.suno.config, action: 'artist_consistency_vox' });
    },
    onInspire(audio: ISunoAudio) {
      if (!audio.audio_url) return;
      this.setOperation({
        ...clearSunoOperation(this.$store.state.suno.config),
        action: 'inspo',
        style: audio.style || this.$store.state.suno.config?.style,
        model: 'chirp-v5',
        custom: true,
        audio_urls: [audio.audio_url]
      });
    },
    async onScrollDown() {
      setTimeout(() => {
        const el = document.querySelector('.tasks');
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 1000);
    },
    onStartTitleEdit(audio: ISunoAudio) {
      this.editingAudioId = audio.id ?? null;
      this.editingTitle = audio.title || '';
      this.$nextTick(() => {
        const input = this.$refs.titleInput as any;
        input?.focus?.();
      });
    },
    onSaveTitleEdit(audio: ISunoAudio) {
      if (this.editingAudioId !== audio.id) return;
      const newTitle = this.editingTitle.trim();
      if (newTitle && newTitle !== audio.title) {
        // Update title in-memory on the task store
        const tasks = this.$store.state.suno?.tasks;
        if (tasks?.items) {
          for (const task of tasks.items) {
            const data = (task?.response?.data ?? []) as ISunoAudio[];
            const match = data.find((a: ISunoAudio) => a.id === audio.id);
            if (match) {
              match.title = newTitle;
              break;
            }
          }
        }
      }
      this.editingAudioId = null;
      this.editingTitle = '';
    },
    onCancelTitleEdit() {
      this.editingAudioId = null;
      this.editingTitle = '';
    },
    async onDelete(audio: ISunoAudio) {
      try {
        await ElMessageBox.confirm(this.$t('suno.message.confirmDelete') as string, {
          confirmButtonText: this.$t('common.button.delete') as string,
          cancelButtonText: this.$t('common.button.cancel') as string,
          type: 'warning'
        });
      } catch {
        return; // User cancelled
      }
      // Remove from local state
      const tasks = this.$store.state.suno?.tasks;
      if (tasks?.items) {
        for (const task of tasks.items) {
          const data = (task?.response?.data ?? []) as ISunoAudio[];
          const idx = data.findIndex((a: ISunoAudio) => a.id === audio.id);
          if (idx !== -1) {
            data.splice(idx, 1);
            // If task has no more audios, remove the task too
            if (data.length === 0) {
              const taskIdx = tasks.items.indexOf(task);
              if (taskIdx !== -1) {
                tasks.items.splice(taskIdx, 1);
              }
            }
            break;
          }
        }
      }
      // Stop player if deleted audio is playing
      if (this.$store.state?.suno?.audio?.id === audio.id) {
        this.$store.dispatch('suno/setAudio', null);
      }
      ElMessage.success(this.$t('suno.message.deleteSuccess'));
    },
    async onGetTasks() {
      if (this.loading) {
        return;
      }
      await this.$store.dispatch('suno/getTasks', {
        limit: 30,
        offset: 0
      });
    }
  }
});
</script>

<style lang="scss">
.icon-button {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}

.task {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  // Group the variations of one generation so the pair reads as a unit
  padding: 4px;
  margin-bottom: 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-border-color-lighter);
  }
  .audio {
    display: flex;
    padding: 6px;
    margin-bottom: 2px;
    border-radius: 10px;
    transition: background-color 0.2s;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background-color: var(--el-bg-color-page);
    }

    &.active {
      background-color: var(--el-color-primary-light-9);
    }

    .left {
      position: relative;
      width: 60px;
      height: 60px;
      margin-right: 16px;
      flex-shrink: 0;

      .cover {
        width: 100%;
        height: 100%;
        border-radius: 6px;
      }

      .duration {
        position: absolute;
        right: 0px;
        bottom: 0px;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 2px 4px;
        color: white;
        border-radius: 2px;
        font-size: 10px;
      }

      .variation-badge {
        position: absolute;
        top: 3px;
        left: 3px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 8px;
        background-color: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 10px;
        line-height: 16px;
        text-align: center;
        font-weight: 600;
      }

      // Always-visible play/pause control (works on touch; brightens on hover)
      .play-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.55);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        opacity: 0.92;
        transition:
          background-color 0.2s,
          opacity 0.2s;
        .el-icon {
          font-size: 16px;
          color: white;
        }
      }

      &:hover .play-btn {
        background-color: var(--el-color-primary);
        opacity: 1;
      }
    }
    .info {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      .title-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .title {
        font-size: 14px;
        font-weight: bold;
        margin-top: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }

      .model-chip {
        flex-shrink: 0;
        margin-top: 5px;
      }
      .edit-icon {
        font-size: 10px;
        color: var(--el-text-color-placeholder);
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
        flex-shrink: 0;
        margin-top: 4px;
      }
      .title-edit {
        margin-top: 4px;
        margin-bottom: 2px;
      }
      .style {
        font-size: 12px;
        margin-top: 2px;
        margin-bottom: 0;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .progress-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 2px;
        .progress-bar {
          flex: 1;
          max-width: 100px;
        }
        .progress-text {
          font-size: 10px;
          color: var(--el-text-color-placeholder);
          white-space: nowrap;
        }
      }
    }
    &:hover .edit-icon {
      opacity: 1;
    }
    .mashup-check {
      display: flex;
      align-items: center;
      padding: 0 4px 0 8px;
      flex-shrink: 0;
    }
    &.mashup-selected {
      background-color: var(--el-color-primary-light-9);
      border-radius: 8px;
    }
    .right {
      width: 140px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 1px;
      .icon {
        display: block;
        z-index: 100;
        cursor: pointer;
        margin-right: 15px;
        color: var(--el-text-color-secondary);
        transition: color 0.2s;
        &:hover {
          color: var(--el-color-primary);
        }
      }
      .el-button {
        margin-right: 15px; /* Add margin to the right of the button */
      }
    }

    // Pulse the cover while a generation is still in flight (~2 min wait)
    &.generating .left .cover {
      animation: suno-pulse 1.4s ease-in-out infinite;
    }
  }
}

@keyframes suno-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

.suno-action-menu {
  .menu-icon {
    width: 14px;
    margin-right: 8px;
    color: var(--el-text-color-secondary);
  }

  .menu-divider {
    height: 1px;
    background: var(--el-border-color-lighter);
    margin: 4px 12px;
  }

  .delete-item {
    color: var(--el-color-danger);
    .delete-icon {
      color: var(--el-color-danger);
    }
  }
}
</style>

<style lang="scss" scoped>
.placeholder-row {
  align-items: center;
  min-height: 72px;
  cursor: default;
  .placeholder-cover {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: var(--el-text-color-placeholder);
    background: linear-gradient(145deg, var(--el-fill-color-light), var(--el-fill-color));
  }
  .cover-status {
    position: absolute;
    right: 4px;
    bottom: 4px;
    color: var(--el-color-danger);
  }
  .task-status {
    margin-top: 3px;
  }
  .pending-cover {
    animation: suno-pulse 1.4s ease-in-out infinite;
  }
  .placeholder-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 16px;
    color: var(--el-text-color-secondary);
    button {
      cursor: pointer;
      padding: 4px;
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
<style lang="scss">
.suno-failure-details {
  font-size: 12px;
  overflow-wrap: anywhere;
  p {
    margin: 0 0 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
