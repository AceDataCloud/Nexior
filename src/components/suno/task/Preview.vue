<template>
  <div class="task">
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
          @click.stop="onPause(audio)"
        >
          <el-icon><video-pause /></el-icon>
        </div>
        <div v-else-if="audio?.audio_url" class="play-btn" @click.stop="onPlay(audio)">
          <el-icon><video-play /></el-icon>
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
          <span v-if="shortModel(audio)" class="model-chip">{{ shortModel(audio) }}</span>
          <font-awesome-icon
            v-if="audio?.audio_url"
            icon="fa-solid fa-pen"
            class="edit-icon"
            @click.stop="onStartTitleEdit(audio)"
          />
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
          <font-awesome-icon
            icon="fa-solid fa-forward"
            class="icon icon-extend"
            @click.stop="onExtend($event, audio)"
          />
        </el-tooltip>
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-tooltip effect="dark" :content="$t('suno.button.download')" placement="top">
              <font-awesome-icon
                v-if="audio?.audio_url || audio?.video_url"
                icon="fa-solid fa-download"
                class="icon icon-download"
              />
            </el-tooltip>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :disabled="isFetchingVideoUrl" @click="handleVideoDownload(audio)">
                <div class="flex items-center min-w-[120px]">
                  <el-icon v-if="isFetchingVideoUrl" class="is-loading mr-2">
                    <Loading />
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
                    <Loading />
                  </el-icon>
                  <span>{{ $t('suno.button.download_wav') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item :disabled="isFetchingMidi" @click="handleMidiDownload(audio)">
                <div class="flex items-center min-w-[120px]">
                  <el-icon v-if="isFetchingMidi" class="is-loading mr-2">
                    <Loading />
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
              <font-awesome-icon
                v-if="audio?.audio_url || audio?.video_url"
                icon="fa-solid fa-ellipsis"
                class="icon icon-ellipsis"
              />
            </el-tooltip>
          </span>
          <template #dropdown>
            <el-dropdown-menu class="suno-action-menu">
              <!-- Creation group -->
              <el-dropdown-item v-if="audio?.audio_url" @click.stop="onExtend($event, audio)">
                <font-awesome-icon icon="fa-solid fa-forward" class="menu-icon" />
                {{ $t('suno.button.extend') }}
              </el-dropdown-item>
              <el-dropdown-item @click.stop="onCover(audio)">
                <font-awesome-icon icon="fa-solid fa-music" class="menu-icon" />
                {{ $t('suno.button.cover_music') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onMashup(audio)">
                <font-awesome-icon icon="fa-solid fa-shuffle" class="menu-icon" />
                {{ $t('suno.button.mashup') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id && audio?.action === 'extend'" @click.stop="onConcatMusic(audio?.id)">
                <font-awesome-icon icon="fa-solid fa-link" class="menu-icon" />
                {{ $t('suno.button.concat_music') }}
              </el-dropdown-item>

              <!-- Editing group -->
              <div class="menu-divider" />
              <el-dropdown-item v-if="audio?.id" @click.stop="onReplaceSection(audio)">
                <font-awesome-icon icon="fa-solid fa-scissors" class="menu-icon" />
                {{ $t('suno.button.replace_section') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onOverpainting(audio)">
                <font-awesome-icon icon="fa-solid fa-microphone" class="menu-icon" />
                {{ $t('suno.button.overpainting') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onUnderpainting(audio)">
                <font-awesome-icon icon="fa-solid fa-guitar" class="menu-icon" />
                {{ $t('suno.button.underpainting') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onSamples(audio)">
                <font-awesome-icon icon="fa-solid fa-drum" class="menu-icon" />
                {{ $t('suno.button.samples') }}
              </el-dropdown-item>

              <!-- Processing group -->
              <div class="menu-divider" />
              <el-dropdown-item v-if="audio.id" @click.stop="onGetStems(audio.id)">
                <font-awesome-icon icon="fa-solid fa-layer-group" class="menu-icon" />
                {{ $t('suno.button.get_stems') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio.id" @click.stop="onGetAllStems(audio.id)">
                <font-awesome-icon icon="fa-solid fa-bars-staggered" class="menu-icon" />
                {{ $t('suno.button.all_stems') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onRemaster(audio.id)">
                <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" class="menu-icon" />
                {{ $t('suno.button.remaster') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onExtractVocals(audio.id)">
                <font-awesome-icon icon="fa-solid fa-headphones" class="menu-icon" />
                {{ $t('suno.button.extract_vocals') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onArtistConsistency(audio)">
                <font-awesome-icon icon="fa-solid fa-palette" class="menu-icon" />
                {{ $t('suno.button.artist_consistency') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onAdjustSpeed(audio)">
                <font-awesome-icon icon="fa-solid fa-gauge-high" class="menu-icon" />
                {{ $t('suno.button.adjust_speed') }}
              </el-dropdown-item>

              <!-- Utility group -->
              <div class="menu-divider" />
              <el-dropdown-item @click.stop="onReusePrompt(audio)">
                <font-awesome-icon icon="fa-solid fa-rotate-left" class="menu-icon" />
                {{ $t('suno.button.reuse_prompt') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onGetTiming(audio.id)">
                <font-awesome-icon icon="fa-solid fa-clock" class="menu-icon" />
                {{ $t('suno.button.get_timing') }}
              </el-dropdown-item>
              <el-dropdown-item @click.stop="onViewCode">
                <font-awesome-icon icon="fa-solid fa-code" class="menu-icon" />
                {{ $t('common.button.viewCode') }}
              </el-dropdown-item>

              <!-- Delete group -->
              <div class="menu-divider" />
              <el-dropdown-item v-if="audio?.id" class="delete-item" @click.stop="onDelete(audio)">
                <font-awesome-icon icon="fa-solid fa-trash" class="menu-icon delete-icon" />
                {{ $t('suno.button.delete') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <api-code-dialog
      v-model:visible="apiCodeVisible"
      method="POST"
      :path="apiCodePath"
      :body="apiCodeBody"
      :token="$store.state.suno?.credential?.token || ''"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useFormatDuring } from '@/utils/number';
import { ISunoAudio, ISunoTask } from '@/models';
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
  ElCheckbox
} from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';
import { ISunoMp4Request, ISunoAudioRequest, Status } from '@/models';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { saveAs } from 'file-saver';
import { sunoOperator } from '@/operators';
import ApiCodeDialog from '@/components/common/ApiCodeDialog.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    ElIcon,
    ElTooltip,
    FontAwesomeIcon,
    VideoPlay,
    VideoPause,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElInput,
    ElProgress,
    ElCheckbox,
    Loading,
    ApiCodeDialog
  },
  props: {
    modelValue: {
      type: Object as () => ISunoTask,
      required: true
    }
  },
  data() {
    return {
      isFetchingVideoUrl: false,
      isFetchingWav: false,
      isFetchingMidi: false,
      editingAudioId: null as string | null,
      editingTitle: '',
      apiCodeVisible: false,
      apiCodePath: '/suno/audios',
      apiCodeBody: {} as Record<string, unknown>
    };
  },
  computed: {
    loading() {
      return this.$store.state.suno?.status?.getApplications === Status.Request;
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
      const data = (this.modelValue?.response?.data ?? []) as ISunoAudio[];
      // @ts-ignore
      const action = this.modelValue?.request?.action as ISunoAudio['action'] | undefined;
      return action ? data.map((a) => ({ ...a, action })) : data;
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
    useFormatDuring,
    shortModel(audio: ISunoAudio): string {
      // "chirp-v5-5" -> "v5.5", "chirp-v3-0" -> "v3" (matches the model selector labels)
      const m = audio?.model;
      if (!m) return '';
      const match = /v(\d+)(?:-(\d+))?(-plus)?/i.exec(m);
      if (!match) return m;
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
      if (this.$store.state?.suno?.audio?.id !== audio.id) {
        this.onPlay({
          ...audio,
          progress: 0
        });
      }
    },
    onExtend(event: MouseEvent, audio: ISunoAudio) {
      event?.stopPropagation();
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
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
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
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
    async onRemaster(audioId: string) {
      await this.onGenerateAudioUrl('remaster', audioId);
    },
    async onGetAllStems(audioId: string) {
      await this.onGenerateAudioUrl('all_stems', audioId);
    },
    onReplaceSection(audio: ISunoAudio) {
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
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
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
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
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
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
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
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
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
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
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'artist_consistency',
        audio: audio,
        audio_id: audio.id
      });
    },
    onAdjustSpeed(audio: ISunoAudio) {
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'adjust_speed',
        audio: audio,
        audio_id: audio.id,
        speed: 1
      });
    },
    onReusePrompt(audio: ISunoAudio) {
      const req = (this.modelValue?.request ?? {}) as ISunoAudioRequest;
      const hasContent =
        req.prompt || req.lyric || req.style || req.title || req.lyric_prompt || req.style_negative || req.persona_id;
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
        style_negative: req.style_negative ?? '',
        vocal_gender: req.vocal_gender,
        weirdness: req.weirdness,
        style_influence: req.style_influence,
        variation_category: req.variation_category,
        audio_weight: req.audio_weight,
        persona_id: req.persona_id,
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
      ElMessage.success(this.$t('suno.message.reusePromptSuccess'));
    },
    async onExtractVocals(audioId: string) {
      const token = this.credential?.token;
      if (!token) return;
      ElMessage.info(this.$t('suno.message.extractingVocals'));
      sunoOperator
        .vox({ audio_id: audioId, async: true }, { token })
        .then(() => {
          ElMessage.success(this.$t('suno.message.extractVocalsSuccess'));
        })
        .catch((error) => {
          ElMessage.error(error?.response?.data?.error?.message || this.$t('suno.message.extractVocalsFailed'));
        })
        .finally(async () => {
          await this.onGetTasks();
          await this.onScrollDown();
        });
    },
    async onGetTiming(audioId: string) {
      const token = this.credential?.token;
      if (!token) return;
      ElMessage.info(this.$t('suno.message.fetchingTiming'));
      sunoOperator
        .timing({ audio_id: audioId }, { token })
        .then(() => {
          ElMessage.success(this.$t('suno.message.fetchTimingSuccess'));
        })
        .catch((error) => {
          ElMessage.error(error?.response?.data?.error?.message || this.$t('suno.message.fetchTimingFailed'));
        });
    },
    async handleWavDownload(audio: ISunoAudio) {
      if (!audio?.id || this.isFetchingWav) return;
      const token = this.credential?.token;
      if (!token) return;
      try {
        this.isFetchingWav = true;
        ElMessage.info(this.$t('suno.message.fetchingWav'));
        const response = await sunoOperator.wav({ audio_id: audio.id }, { token });
        // Worker returns `data: [{ file_url }]` (array, not an object).
        const wavUrl = response.data?.data?.[0]?.file_url;
        if (wavUrl) {
          this.onDownload(null, wavUrl);
        } else {
          ElMessage.error(this.$t('suno.message.fetchWavFailed'));
        }
      } catch (error) {
        const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message;
        ElMessage.error(message || this.$t('suno.message.fetchWavFailed'));
      } finally {
        this.isFetchingWav = false;
      }
    },
    async handleMidiDownload(audio: ISunoAudio) {
      if (!audio?.id || this.isFetchingMidi) return;
      const token = this.credential?.token;
      if (!token) return;
      try {
        this.isFetchingMidi = true;
        ElMessage.info(this.$t('suno.message.fetchingMidi'));
        const response = await sunoOperator.midi({ audio_id: audio.id }, { token });
        // Worker returns structured note data, no URL — save raw JSON for the user.
        const data = response.data?.data;
        if (!data?.length) {
          ElMessage.error(this.$t('suno.message.fetchMidiFailed'));
          return;
        }
        const filename = (audio.title || audio.id || 'suno').replace(/[^\w.-]+/g, '_') + '.json';
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, filename);
      } catch (error) {
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
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('suno.message.startingTask'));
      sunoOperator
        .audio(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('suno.message.startTaskSuccess'));
        })
        .catch((error) => {
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
        ids.push(audio.id);
      }
      this.$store.commit('suno/setConfig', {
        ...this.$store.state.suno?.config,
        mashup_audio_ids: ids
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
          confirmButtonText: this.$t('suno.button.delete') as string,
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
        padding: 0 6px;
        height: 16px;
        line-height: 16px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 600;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
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
