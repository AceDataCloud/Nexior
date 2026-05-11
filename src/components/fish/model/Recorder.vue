<template>
  <div class="recorder">
    <!-- Script to read while recording -->
    <div v-if="state !== 'recorded'" class="script">
      <div class="script-header">
        <font-awesome-icon icon="fa-solid fa-book-open" class="icon mr-1" />
        <span class="label">{{ $t('fish.description.readScript') }}</span>
        <el-button link size="small" class="ml-auto" :disabled="state === 'recording'" @click="nextScript">
          <font-awesome-icon icon="fa-solid fa-shuffle" class="mr-1" />
          {{ $t('fish.button.nextScript') }}
        </el-button>
      </div>
      <p class="script-text">{{ currentScript }}</p>
    </div>

    <!-- Recording controls -->
    <div class="controls">
      <el-button
        v-if="state === 'idle'"
        type="danger"
        circle
        size="large"
        :title="$t('fish.button.startRecord')"
        @click="startRecord"
      >
        <font-awesome-icon icon="fa-solid fa-microphone" />
      </el-button>
      <el-button
        v-else-if="state === 'recording'"
        type="warning"
        circle
        size="large"
        :title="$t('fish.button.stopRecord')"
        @click="stopRecord"
      >
        <font-awesome-icon icon="fa-solid fa-stop" />
      </el-button>
      <div class="status">
        <span :class="['timer', state === 'recording' ? 'live' : '']">{{ formattedTime }}</span>
        <span class="hint">
          {{
            state === 'idle'
              ? $t('fish.description.recorderIdle')
              : state === 'recording'
                ? $t('fish.description.recorderRecording')
                : $t('fish.description.recorderRecorded')
          }}
        </span>
      </div>
    </div>

    <!-- Preview after stop -->
    <div v-if="state === 'recorded' && recordedUrl" class="preview">
      <audio :src="recordedUrl" controls preload="metadata" class="w-full" />
      <div class="preview-actions">
        <el-button size="small" :disabled="uploading" @click="reset">
          <font-awesome-icon icon="fa-solid fa-rotate-left" class="mr-1" />
          {{ $t('fish.button.reRecord') }}
        </el-button>
        <el-button size="small" type="primary" :loading="uploading" @click="useRecording">
          <font-awesome-icon icon="fa-solid fa-check" class="mr-1" />
          {{ $t('fish.button.useRecording') }}
        </el-button>
      </div>
    </div>

    <div class="footer">
      <el-button link size="small" :disabled="uploading || state === 'recording'" @click="onCancel">
        {{ $t('fish.button.cancel') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import { ElButton, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';

const SCRIPT_COUNT = 4;
const MAX_RECORDING_SECONDS = 90;

type RecorderState = 'idle' | 'recording' | 'recorded';

interface IData {
  state: RecorderState;
  scriptIndex: number;
  seconds: number;
  timerId: number;
  maxTimerId: number;
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  chunks: Blob[];
  recordedBlob: Blob | null;
  recordedUrl: string;
  uploading: boolean;
}

export default defineComponent({
  name: 'FishRecorder',
  components: {
    ElButton,
    FontAwesomeIcon
  },
  emits: ['done', 'cancel'],
  data(): IData {
    return {
      state: 'idle',
      scriptIndex: 0,
      seconds: 0,
      timerId: 0,
      maxTimerId: 0,
      mediaRecorder: null,
      stream: null,
      chunks: [],
      recordedBlob: null,
      recordedUrl: '',
      uploading: false
    };
  },
  computed: {
    formattedTime(): string {
      const m = Math.floor(this.seconds / 60);
      const s = this.seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },
    currentScript(): string {
      const key = `fish.script.passage${(this.scriptIndex % SCRIPT_COUNT) + 1}`;
      return this.$t(key) as string;
    }
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    nextScript() {
      this.scriptIndex = (this.scriptIndex + 1) % SCRIPT_COUNT;
    },
    async startRecord() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        ElMessage.error(this.$t('fish.message.recorderUnsupported'));
        return;
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        ElMessage.error(this.$t(denied ? 'fish.message.micDenied' : 'fish.message.micError'));
        return;
      }
      this.chunks = [];
      const mimeType = this.pickMimeType();
      try {
        this.mediaRecorder = mimeType ? new MediaRecorder(this.stream, { mimeType }) : new MediaRecorder(this.stream);
      } catch {
        this.mediaRecorder = new MediaRecorder(this.stream);
      }
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        this.recordedBlob = blob;
        this.recordedUrl = URL.createObjectURL(blob);
        this.state = 'recorded';
        this.releaseStream();
      };
      this.mediaRecorder.start();
      this.state = 'recording';
      this.seconds = 0;
      this.timerId = window.setInterval(() => {
        this.seconds++;
      }, 1000);
      // Hard cap so the page can't be left recording forever.
      this.maxTimerId = window.setTimeout(() => {
        if (this.state === 'recording') this.stopRecord();
      }, MAX_RECORDING_SECONDS * 1000);
    },
    stopRecord() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      window.clearInterval(this.timerId);
      window.clearTimeout(this.maxTimerId);
    },
    reset() {
      if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
      this.recordedUrl = '';
      this.recordedBlob = null;
      this.state = 'idle';
      this.seconds = 0;
    },
    onCancel() {
      this.cleanup();
      this.$emit('cancel');
    },
    cleanup() {
      this.stopRecord();
      this.releaseStream();
      if (this.recordedUrl) URL.revokeObjectURL(this.recordedUrl);
    },
    releaseStream() {
      this.stream?.getTracks().forEach((t) => t.stop());
      this.stream = null;
    },
    pickMimeType(): string | undefined {
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      for (const c of candidates) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
      }
      return undefined;
    },
    extensionForMime(mime: string): string {
      if (mime.includes('webm')) return 'webm';
      if (mime.includes('mp4')) return 'm4a';
      if (mime.includes('ogg')) return 'ogg';
      if (mime.includes('wav')) return 'wav';
      return 'mp3';
    },
    async useRecording() {
      if (!this.recordedBlob) return;
      if (this.seconds < 3) {
        ElMessage.warning(this.$t('fish.message.recordingTooShort'));
        return;
      }
      this.uploading = true;
      try {
        const token = this.$store.state.token?.access;
        const ext = this.extensionForMime(this.recordedBlob.type || '');
        const file = new File([this.recordedBlob], `recording-${Date.now()}.${ext}`, {
          type: this.recordedBlob.type || 'audio/webm'
        });
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await axios.post(`${getBaseUrlPlatform()}/api/v1/files/`, fd, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const url = data?.file_url;
        if (!url) {
          ElMessage.error(this.$t('fish.message.uploadError'));
          return;
        }
        this.$emit('done', { url, text: this.currentScript });
      } catch (err) {
        ElMessage.error(this.$t('fish.message.uploadError'));
        console.error('recorder upload failed', err);
      } finally {
        this.uploading = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.recorder {
  border: 1px dashed var(--app-border-subtle);
  border-radius: 12px;
  padding: 12px;
  background: var(--el-fill-color-blank);

  .script {
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;

    .script-header {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;

      .ml-auto {
        margin-left: auto;
      }
    }

    .script-text {
      font-size: 13px;
      color: var(--el-text-color-regular);
      line-height: 1.6;
      margin: 0;
      word-break: break-word;
    }
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 12px;

    .status {
      display: flex;
      flex-direction: column;
    }
    .timer {
      font-family: var(--el-font-family-mono, monospace);
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      &.live {
        color: var(--el-color-danger);
        animation: blink 1.2s ease-in-out infinite;
      }
    }
    .hint {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }
  }

  .preview {
    margin-top: 12px;

    .preview-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  }

  .footer {
    margin-top: 8px;
    text-align: right;
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
</style>
