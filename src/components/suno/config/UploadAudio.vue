<template>
  <div class="relative">
    <div class="flex justify-between items-center mb-2">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('suno.name.referenceAudios') }}</span>
        <info-icon :content="$t('suno.description.uploadAudios')" />
      </div>
      <el-button round type="primary" size="small" @click="dialogVisible = true">
        <font-awesome-icon icon="fa-solid fa-plus" class="icon mr-1" />
        {{ $t('suno.button.addAudio') }}
      </el-button>
    </div>
    <div v-if="audioPreviewUrl" class="mb-2">
      <audio :src="audioPreviewUrl" controls class="w-full" />
    </div>
    <div v-if="hasUploadedAudio" class="mt-2">
      <el-radio-group v-model="uploadAction" size="small">
        <el-radio-button value="upload_extend">{{ $t('suno.button.extend') }}</el-radio-button>
        <el-radio-button value="upload_cover">{{ $t('suno.button.upload_cover') }}</el-radio-button>
      </el-radio-group>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="$t('suno.name.addAudio')"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-tabs v-model="activeTab" class="add-audio-tabs">
        <el-tab-pane name="browse" :label="$t('suno.tab.browse')">
          <div class="py-4">
            <el-upload
              v-model:file-list="fileList"
              name="file"
              :limit="1"
              class="upload-wrapper"
              :action="uploadUrl"
              accept=".mp3,.wav,.m4a,audio/*"
              :show-file-list="true"
              :on-exceed="onExceed"
              :on-error="onError"
              :on-success="onBrowseSuccess"
              :headers="headers"
              drag
            >
              <div class="text-center py-6">
                <font-awesome-icon icon="fa-solid fa-upload" class="text-4xl text-gray-400 mb-3" />
                <div class="text-sm">{{ $t('suno.description.dropAudioHere') }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ $t('suno.description.audioFormats') }}</div>
              </div>
            </el-upload>
          </div>
        </el-tab-pane>
        <el-tab-pane name="record" :label="$t('suno.tab.record')">
          <div class="py-4 text-center">
            <div class="recorder-display mb-4">
              <div v-if="recording" class="text-red-500 flex items-center justify-center gap-2">
                <span class="recording-dot" />
                <span class="text-2xl font-mono">{{ formattedTime }}</span>
              </div>
              <div v-else-if="recordedBlob" class="text-green-600">
                <font-awesome-icon icon="fa-solid fa-check-circle" class="text-2xl mr-2" />
                <span>{{ $t('suno.message.recordingReady') }} ({{ formattedTime }})</span>
              </div>
              <div v-else class="text-gray-400 text-2xl font-mono">00:00</div>
            </div>
            <div v-if="recordedAudioUrl && !recording" class="mb-4">
              <audio :src="recordedAudioUrl" controls class="w-full" />
            </div>
            <div class="flex justify-center gap-3">
              <el-button v-if="!recording && !recordedBlob" type="primary" round @click="startRecording">
                <font-awesome-icon icon="fa-solid fa-microphone" class="mr-1" />
                {{ $t('suno.button.startRecord') }}
              </el-button>
              <el-button v-if="recording" type="danger" round @click="stopRecording">
                <font-awesome-icon icon="fa-solid fa-stop" class="mr-1" />
                {{ $t('suno.button.stopRecord') }}
              </el-button>
              <template v-if="recordedBlob && !recording">
                <el-button round @click="resetRecording">
                  <font-awesome-icon icon="fa-solid fa-rotate-left" class="mr-1" />
                  {{ $t('suno.button.reRecord') }}
                </el-button>
                <el-button type="primary" round :loading="uploadingRecord" @click="uploadRecording">
                  <font-awesome-icon icon="fa-solid fa-upload" class="mr-1" />
                  {{ $t('suno.button.useRecording') }}
                </el-button>
              </template>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElUpload,
  ElButton,
  ElDialog,
  ElTabs,
  ElTabPane,
  UploadFiles,
  UploadFile,
  ElMessage,
  ElRadioGroup,
  ElRadioButton
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform, uploadTrackerMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { ISunoUploadRequest } from '@/models';
import { sunoOperator } from '@/operators';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
  dialogVisible: boolean;
  activeTab: 'browse' | 'record';
  recording: boolean;
  recordedBlob: Blob | null;
  recordedAudioUrl: string | null;
  audioPreviewUrl: string | null;
  recordTimer: number | null;
  recordSeconds: number;
  mediaRecorder: MediaRecorder | null;
  mediaStream: MediaStream | null;
  recordedChunks: Blob[];
  uploadingRecord: boolean;
}

export default defineComponent({
  name: 'UploadAudio',
  components: {
    ElUpload,
    ElButton,
    ElDialog,
    ElTabs,
    ElTabPane,
    InfoIcon,
    FontAwesomeIcon,
    ElRadioGroup,
    ElRadioButton
  },
  mixins: [uploadTrackerMixin],
  emits: ['change'],
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      dialogVisible: false,
      activeTab: 'browse',
      recording: false,
      recordedBlob: null,
      recordedAudioUrl: null,
      audioPreviewUrl: null,
      recordTimer: null,
      recordSeconds: 0,
      mediaRecorder: null,
      mediaStream: null,
      recordedChunks: [],
      uploadingRecord: false
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    credential() {
      return this.$store.state.suno.credential;
    },
    config() {
      return this.$store.state.suno.config;
    },
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    value: {
      get() {
        return this.$store.state.suno?.config?.audio_id;
      },
      set() {}
    },
    hasUploadedAudio() {
      const action = this.$store.state.suno?.config?.action;
      return action === 'upload_extend' || action === 'upload_cover';
    },
    uploadAction: {
      get() {
        return this.$store.state.suno?.config?.action || 'upload_extend';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          action: val
        });
      }
    },
    formattedTime(): string {
      const m = Math.floor(this.recordSeconds / 60)
        .toString()
        .padStart(2, '0');
      const s = (this.recordSeconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
  },
  watch: {
    urls: {
      handler(val) {
        this.$emit('change', val);
      }
    }
  },
  beforeUnmount() {
    this.cleanupRecording();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('suno.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('suno.message.uploadReferencesError'));
    },
    async onBrowseSuccess() {
      const url = this.urls?.[0];
      if (url) {
        this.audioPreviewUrl = url;
        await this.onGenerateAudioId(url);
        this.dialogVisible = false;
      }
    },
    async onGenerateAudioId(audio_url: string) {
      const request = {
        audio_url
      } as ISunoUploadRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('suno.message.startingUploadAudio'));
      try {
        const response = await sunoOperator.upload(request, { token });
        console.debug('get upload music success', response.data);
        const audio_id = response.data?.data.audio_id;
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          audio_id: audio_id,
          action: 'upload_extend'
        });
        ElMessage.success(this.$t('suno.message.startUploadAudioSuccess'));
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.error?.message || this.$t('suno.message.startUploadAudioFailed'));
      }
    },
    async startRecording() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        ElMessage.error(this.$t('suno.message.recordingUnsupported'));
        return;
      }
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(this.mediaStream);
        this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          this.recordedBlob = blob;
          if (this.recordedAudioUrl) URL.revokeObjectURL(this.recordedAudioUrl);
          this.recordedAudioUrl = URL.createObjectURL(blob);
          this.releaseStream();
        };
        this.mediaRecorder.start();
        this.recording = true;
        this.recordSeconds = 0;
        this.recordTimer = window.setInterval(() => {
          this.recordSeconds += 1;
          if (this.recordSeconds >= 600) {
            this.stopRecording();
          }
        }, 1000);
      } catch (err: any) {
        console.error('record error', err);
        ElMessage.error(this.$t('suno.message.recordingPermissionDenied'));
      }
    },
    stopRecording() {
      if (this.recordTimer) {
        window.clearInterval(this.recordTimer);
        this.recordTimer = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.recording = false;
    },
    resetRecording() {
      if (this.recordedAudioUrl) {
        URL.revokeObjectURL(this.recordedAudioUrl);
      }
      this.recordedBlob = null;
      this.recordedAudioUrl = null;
      this.recordSeconds = 0;
    },
    async uploadRecording() {
      if (!this.recordedBlob) return;
      this.uploadingRecord = true;
      try {
        const formData = new FormData();
        const filename = `recording-${Date.now()}.webm`;
        formData.append('file', this.recordedBlob, filename);
        const resp = await fetch(this.uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.$store.state.token.access}`
          },
          body: formData
        });
        if (!resp.ok) throw new Error(`upload failed: ${resp.status}`);
        const data = await resp.json();
        const url = data?.file_url || data?.data?.file_url;
        if (!url) throw new Error('no file_url in response');
        this.audioPreviewUrl = url;
        await this.onGenerateAudioId(url);
        this.dialogVisible = false;
        this.resetRecording();
      } catch (error: any) {
        console.error(error);
        ElMessage.error(error?.message || this.$t('suno.message.uploadReferencesError'));
      } finally {
        this.uploadingRecord = false;
      }
    },
    releaseStream() {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
      }
    },
    cleanupRecording() {
      if (this.recordTimer) {
        window.clearInterval(this.recordTimer);
        this.recordTimer = null;
      }
      this.releaseStream();
      if (this.recordedAudioUrl) {
        URL.revokeObjectURL(this.recordedAudioUrl);
        this.recordedAudioUrl = null;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin-bottom: 0;
  width: 30%;
}
.recorder-display {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.recording-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f56c6c;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>

<style lang="scss">
.upload-wrapper {
  width: 100%;
  .el-upload {
    width: 100%;
  }
  .el-upload-dragger {
    width: 100%;
    padding: 12px;
  }
  .el-upload-list {
    margin: 0;
    width: 100%;
  }
}
.add-audio-tabs .el-tabs__nav-wrap::after {
  height: 1px;
}
</style>
