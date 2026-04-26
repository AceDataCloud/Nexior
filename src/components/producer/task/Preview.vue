<template>
  <div class="task">
    <div v-for="audio in audios" :key="audio.id" class="audio" @click.stop="onClick(audio)">
      <div v-loading="!audio?.audio_url" class="left">
        <el-image :src="audio?.image_url" class="cover" fit="cover" lazy />
        <div
          v-if="
            audio?.audio_url &&
            $store.state?.producer?.audio?.id === audio.id &&
            $store.state?.producer?.audio?.state === 'playing'
          "
          class="overlay"
          @click.stop="onPause(audio)"
        >
          <el-icon><video-pause /></el-icon>
        </div>
        <div
          v-if="
            audio?.audio_url &&
            ($store.state?.producer?.audio?.id !== audio.id ||
              ($store.state?.producer?.audio?.id === audio.id && $store.state?.producer?.audio?.state === 'paused'))
          "
          class="overlay"
          @click.stop="onPlay(audio)"
        >
          <el-icon><video-play /></el-icon>
        </div>
        <div v-if="audio?.duration" class="duration">
          {{ useFormatDuring(audio?.duration) }}
        </div>
      </div>
      <div class="info">
        <h2 class="title">{{ audio?.title }}</h2>
        <p class="style">{{ audio?.style }}</p>
      </div>
      <div class="right">
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-tooltip effect="dark" :content="$t('producer.button.download')" placement="top">
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
                  <span>{{ $t('producer.button.download_video') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.audio_url" @click.stop="onDownload($event, audio?.audio_url)">
                {{ $t('producer.button.download_audio') }}
              </el-dropdown-item>
              <el-dropdown-item :disabled="isFetchingWav" @click="handleWavDownload(audio)">
                <div class="flex items-center min-w-[120px]">
                  <el-icon v-if="isFetchingWav" class="is-loading mr-2">
                    <Loading />
                  </el-icon>
                  <span>{{ $t('producer.button.download_wav') }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-tooltip effect="dark" :content="$t('producer.button.more')" placement="top">
              <font-awesome-icon
                v-if="audio?.audio_url || audio?.video_url"
                icon="fa-solid fa-ellipsis"
                class="icon icon-ellipsis"
              />
            </el-tooltip>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="audio?.audio_url" @click.stop="onExtend($event, audio)">
                {{ $t('producer.button.extend') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio.id" @click.stop="onGetStems(audio.id)">
                {{ $t('producer.button.get_stems') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio.id" @click.stop="onGetAllStems(audio.id)">
                {{ $t('producer.button.all_stems') }}
              </el-dropdown-item>
              <el-dropdown-item @click.stop="onCover(audio)">
                {{ $t('producer.button.cover_music') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onVariation(audio)">
                {{ $t('producer.button.variation') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onSwapVocals(audio.id)">
                {{ $t('producer.button.swap_vocals') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onSwapInstrumentals(audio.id)">
                {{ $t('producer.button.swap_instrumentals') }}
              </el-dropdown-item>
              <el-dropdown-item v-if="audio?.id" @click.stop="onReplaceSection(audio)">
                {{ $t('producer.button.replace_section') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useFormatDuring } from '@/utils/number';
import { IProducerAudio, IProducerTask } from '@/models';
import { ElImage, ElIcon, ElTooltip, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';
import { IProducerVideoRequest, IProducerAudioRequest, Status } from '@/models';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { saveAs } from 'file-saver';
import { producerOperator } from '@/operators';

const CALLBACK_URL = 'https://webhook.acedata.cloud/producer';

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
    Loading
  },
  props: {
    modelValue: {
      type: Object as () => IProducerTask,
      required: true
    }
  },
  data() {
    return {
      isFetchingVideoUrl: false,
      isFetchingWav: false
    };
  },
  computed: {
    loading() {
      return this.$store.state.producer?.status?.getApplications === Status.Request;
    },
    credential() {
      return this.$store.state.producer.credential;
    },
    config() {
      return this.$store.state.producer.config;
    },
    task() {
      return this.$store.state.producer?.tasks;
    },
    audios(): IProducerAudio[] {
      const data = (this.modelValue?.response?.data ?? []) as IProducerAudio[];
      // @ts-ignore
      const action = this.modelValue?.request?.action as IProducerAudio['action'] | undefined;
      return action ? data.map((a) => ({ ...a, action })) : data;
    },
    application() {
      return this.$store.state.producer?.application;
    },
    active() {
      return this.$store.state.producer?.tasks?.active;
    }
  },
  methods: {
    useFormatDuring,
    onPlay(audio: IProducerAudio) {
      this.$store.dispatch('producer/setAudio', {
        ...this.$store.state.producer.audio,
        ...audio,
        state: 'playing'
      });
      console.log('on play');
    },
    onPause(audio: IProducerAudio) {
      this.$store.dispatch('producer/setAudio', {
        ...this.$store.state.producer.audio,
        ...audio,
        state: 'paused'
      });
      console.log('on pause');
    },
    onClick(audio: IProducerAudio) {
      if (this.$store.state?.producer?.audio?.id !== audio.id) {
        this.onPlay({
          ...audio,
          progress: 0
        });
      }
    },
    onExtend(event: MouseEvent, audio: IProducerAudio) {
      event.stopPropagation();
      console.debug('set config', audio);
      this.$store.commit('producer/setConfig', {
        ...this.$store.state.producer?.config,
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
        event.stopPropagation();
      }
      const parsedUrl = new URL(audioUrl);
      const pathname = parsedUrl.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      fetch(audioUrl)
        .then((response) => response.blob())
        .then((blob) => {
          saveAs(blob, filename);
        });
    },
    async handleVideoDownload(audio: IProducerAudio) {
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
        console.log(`get videoUrl: ${videoUrl}`);
        audio.video_url = videoUrl;
        this.onDownload(null, videoUrl);
      } catch (error) {
        console.error('get videoUrl failed:', error);
        ElMessage.error(this.$t('producer.message.getVideoUrlFailed'));
      } finally {
        this.isFetchingVideoUrl = false;
      }
    },
    async fetchVideoUrlFromApi(audioId: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const request = {
          audio_id: audioId
        } as IProducerVideoRequest;
        const token = this.credential?.token;
        if (!token) {
          console.error('no token specified');
          reject(new Error('No token specified'));
          return;
        }
        producerOperator
          .video(request, { token })
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
      event.stopPropagation();
      window.open(videoUrl, '_blank');
    },
    async onGetStems(audioId: string) {
      await this.onGenerateAudioUrl('stems', audioId);
    },
    onCover(audio: IProducerAudio) {
      this.$store.commit('producer/setConfig', {
        ...this.$store.state.producer?.config,
        model: audio.model,
        custom: true,
        instrumental: false,
        style: audio.style,
        action: 'cover',
        audio: audio,
        audio_id: audio.id
      });
    },
    onVariation(audio: IProducerAudio) {
      this.$store.commit('producer/setConfig', {
        ...this.$store.state.producer?.config,
        model: audio.model,
        custom: true,
        style: audio.style,
        action: 'variation',
        audio: audio,
        audio_id: audio.id
      });
    },
    async onSwapVocals(audioId: string) {
      await this.onGenerateAudioUrl('swap_vocals', audioId);
    },
    async onSwapInstrumentals(audioId: string) {
      await this.onGenerateAudioUrl('swap_instrumentals', audioId);
    },
    async onGetAllStems(audioId: string) {
      await this.onGenerateAudioUrl('all_stems', audioId);
    },
    onReplaceSection(audio: IProducerAudio) {
      this.$store.commit('producer/setConfig', {
        ...this.$store.state.producer?.config,
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
    async handleWavDownload(audio: IProducerAudio) {
      if (!audio?.id || this.isFetchingWav) return;
      const token = this.credential?.token;
      if (!token) return;
      try {
        this.isFetchingWav = true;
        ElMessage.info(this.$t('producer.message.fetchingWav'));
        const response = await producerOperator.wav({ audio_id: audio.id }, { token });
        const wavUrl = response.data?.data?.audio_url;
        if (wavUrl) {
          this.onDownload(null, wavUrl);
        } else {
          ElMessage.error(this.$t('producer.message.fetchWavFailed'));
        }
      } catch {
        ElMessage.error(this.$t('producer.message.fetchWavFailed'));
      } finally {
        this.isFetchingWav = false;
      }
    },
    async onGenerateAudioUrl(action: string, audioId: string) {
      const request = {
        action,
        audio_id: audioId,
        callback_url: CALLBACK_URL
      } as IProducerAudioRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('producer.message.startingTask'));
      producerOperator
        .audio(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('producer.message.startTaskSuccess'));
        })
        .catch((error) => {
          ElMessage.error(error?.response?.data?.error?.message || this.$t('producer.message.startTaskFailed'));
        })
        .finally(async () => {
          await this.onGetTasks();
          await this.onScrollDown();
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
    async onGetTasks() {
      if (this.loading) {
        console.debug('loading');
        return;
      }
      await this.$store.dispatch('producer/getTasks', {
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
  .audio {
    display: flex;
    margin-bottom: 10px;
    border-radius: 10px;

    &:hover {
      background-color: var(--el-bg-color-page);
    }

    .left {
      position: relative;
      width: 60px;
      height: 60px;
      margin-right: 16px;
      flex-shrink: 0;

      &:hover .overlay {
        display: block;
      }

      .cover {
        width: 100%;
        height: 100%;
        border-radius: 4px;
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

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        display: none;
        transition: opacity 0.3s;
        border-radius: 4px;
        text-align: center;
        line-height: 70px;
        cursor: pointer;
        .el-icon {
          font-size: 20px;
          color: white;
        }
      }
    }
    .info {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      .title {
        font-size: 14px;
        font-weight: bold;
        margin-top: 5px;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
      .style {
        font-size: 12px;
        margin-bottom: 0;
        color: var(--el-text-color-secondary);
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
    }
    .right {
      width: 120px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 1px;
      .icon {
        display: block;
        z-index: 100;
        cursor: pointer;
        margin-right: 15px;
      }
      .el-button {
        margin-right: 15px;
      }
    }
  }
}
</style>
