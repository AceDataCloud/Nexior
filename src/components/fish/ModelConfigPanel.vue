<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Title -->
      <div class="field-block mb-4">
        <h2 class="title font-bold">
          {{ $t('fish.name.voiceTitle') }}
          <span class="required">*</span>
        </h2>
        <el-input v-model="form.title" :placeholder="$t('fish.placeholder.voiceTitle')" maxlength="60" />
      </div>

      <!-- Reference audio: upload OR record -->
      <div class="field-block mb-4">
        <div class="flex items-baseline justify-between mb-1">
          <h2 class="title font-bold">
            {{ $t('fish.name.referenceAudio') }}
            <span class="required">*</span>
          </h2>
          <span v-if="!form.voicesUrl && !recording" class="muted">{{ $t('fish.description.audioRequired') }}</span>
        </div>
        <p class="hint">{{ $t('fish.description.uploadAudio') }}</p>

        <!-- Empty state: pick a method -->
        <div v-if="!form.voicesUrl && !recording" class="audio-actions">
          <el-upload
            v-model:file-list="fileList"
            name="file"
            :limit="1"
            class="upload-wrapper"
            :action="uploadUrl"
            accept=".mp3,.wav,.m4a,.ogg,.webm,audio/*"
            :show-file-list="false"
            :on-exceed="onExceed"
            :on-error="onUploadError"
            :on-success="onUploadSuccess"
            :before-upload="onBeforeUpload"
            :headers="uploadHeaders"
          >
            <el-button round :loading="uploading">
              <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
              {{ $t('fish.button.uploadAudio') }}
            </el-button>
          </el-upload>
          <el-button round type="primary" plain :disabled="!supportsRecorder" @click="recording = true">
            <font-awesome-icon icon="fa-solid fa-microphone" class="icon mr-1" />
            {{ $t('fish.button.recordAudio') }}
          </el-button>
        </div>
        <p v-if="!supportsRecorder && !form.voicesUrl && !recording" class="hint warn">
          {{ $t('fish.message.recorderUnsupported') }}
        </p>

        <!-- Live recorder -->
        <recorder v-if="recording" class="mt-2" @done="onRecorded" @cancel="recording = false" />

        <!-- Audio ready for review -->
        <div v-if="form.voicesUrl && !recording" class="mt-2">
          <audio :src="form.voicesUrl" controls preload="metadata" class="w-full" />
          <div class="ready-actions">
            <el-button link size="small" @click="clearAudio">
              <font-awesome-icon icon="fa-solid fa-rotate-left" class="mr-1" />
              {{ $t('fish.button.replaceAudio') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- Audio transcript / texts -->
      <div class="field-block mb-4">
        <h2 class="title font-bold">{{ $t('fish.name.audioTexts') }}</h2>
        <p class="hint">{{ $t('fish.description.audioTexts') }}</p>
        <el-input
          v-model="form.texts"
          type="textarea"
          :rows="2"
          :placeholder="$t('fish.placeholder.audioTexts')"
          maxlength="500"
        />
      </div>

      <!-- Description -->
      <div class="field-block mb-4">
        <h2 class="title font-bold">{{ $t('fish.name.voiceDescription') }}</h2>
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('fish.placeholder.voiceDescription')"
          maxlength="500"
        />
      </div>

      <!-- Visibility -->
      <div class="field-block mb-4">
        <h2 class="title font-bold">{{ $t('fish.name.visibility') }}</h2>
        <el-radio-group v-model="form.visibility" size="small">
          <el-radio-button label="private" value="private">{{ $t('fish.value.private') }}</el-radio-button>
          <el-radio-button label="unlist" value="unlist">{{ $t('fish.value.unlist') }}</el-radio-button>
          <el-radio-button label="public" value="public">{{ $t('fish.value.public') }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Train mode -->
      <div class="field-block mb-4">
        <h2 class="title font-bold">{{ $t('fish.name.trainMode') }}</h2>
        <el-radio-group v-model="form.trainMode" size="small">
          <el-radio-button label="fast" value="fast">{{ $t('fish.value.trainModeFast') }}</el-radio-button>
          <el-radio-button label="precise" value="precise">{{ $t('fish.value.trainModePrecise') }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Toggles -->
      <div class="field-row">
        <h2 class="title font-bold">{{ $t('fish.name.enhanceAudio') }}</h2>
        <el-switch v-model="form.enhanceAudio" />
      </div>
      <p class="hint mt-0 mb-3">{{ $t('fish.description.enhanceAudio') }}</p>

      <div class="field-row">
        <h2 class="title font-bold">{{ $t('fish.name.generateSample') }}</h2>
        <el-switch v-model="form.generateSample" />
      </div>
      <p class="hint mt-0 mb-2">{{ $t('fish.description.generateSample') }}</p>
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <el-button
        type="primary"
        class="btn w-full"
        round
        :disabled="!canCreate || creating"
        :loading="creating"
        @click="onCreate"
      >
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('fish.button.createModel') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElButton,
  ElInput,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElSwitch,
  ElUpload,
  UploadFile,
  UploadFiles
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';
import Recorder from './model/Recorder.vue';

const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;

export interface IFishCreatePayload {
  title: string;
  voices: string;
  description?: string;
  visibility: 'public' | 'unlist' | 'private';
  train_mode: 'fast' | 'precise';
  texts?: string[];
  enhance_audio_quality?: boolean;
  generate_sample?: boolean;
}

type Visibility = 'public' | 'unlist' | 'private';
type TrainMode = 'fast' | 'precise';

interface IForm {
  title: string;
  description: string;
  texts: string;
  voicesUrl: string;
  visibility: Visibility;
  trainMode: TrainMode;
  enhanceAudio: boolean;
  generateSample: boolean;
}

interface IData {
  form: IForm;
  fileList: UploadFiles;
  uploading: boolean;
  creating: boolean;
  recording: boolean;
}

const defaultForm = (): IForm => ({
  title: '',
  description: '',
  texts: '',
  voicesUrl: '',
  visibility: 'unlist',
  trainMode: 'fast',
  enhanceAudio: true,
  generateSample: false
});

export default defineComponent({
  name: 'FishModelConfigPanel',
  components: {
    ElButton,
    ElInput,
    ElRadioButton,
    ElRadioGroup,
    ElSwitch,
    ElUpload,
    FontAwesomeIcon,
    Recorder
  },
  emits: ['create'],
  data(): IData {
    return {
      form: defaultForm(),
      fileList: [],
      uploading: false,
      creating: false,
      recording: false
    };
  },
  computed: {
    uploadUrl(): string {
      return getBaseUrlPlatform() + '/api/v1/files/';
    },
    uploadHeaders(): Record<string, string> {
      return { Authorization: `Bearer ${this.$store.state.token?.access}` };
    },
    canCreate(): boolean {
      return !!this.form.title.trim() && !!this.form.voicesUrl && !this.uploading && !this.creating;
    },
    supportsRecorder(): boolean {
      const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
      return !!md?.getUserMedia && typeof MediaRecorder !== 'undefined';
    }
  },
  methods: {
    onBeforeUpload(file: File): boolean {
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        ElMessage.warning(this.$t('fish.message.audioSizeExceed'));
        return false;
      }
      this.uploading = true;
      return true;
    },
    onExceed() {
      ElMessage.warning(this.$t('fish.message.audioOnlyOne'));
    },
    onUploadError() {
      this.uploading = false;
      ElMessage.error(this.$t('fish.message.uploadError'));
    },
    onUploadSuccess(response: { file_url?: string } | undefined, _file: UploadFile, fileList: UploadFiles) {
      this.uploading = false;
      const url = response?.file_url;
      if (!url) {
        ElMessage.error(this.$t('fish.message.uploadError'));
        this.fileList = [];
        return;
      }
      this.form.voicesUrl = url;
      this.fileList = fileList;
    },
    onRecorded(payload: { url: string; text?: string }) {
      this.form.voicesUrl = payload.url;
      this.recording = false;
      // Auto-fill the transcript with the script the user just read — fish
      // uses `texts` to align audio with text during training.
      if (payload.text && !this.form.texts.trim()) {
        this.form.texts = payload.text;
      }
    },
    clearAudio() {
      this.form.voicesUrl = '';
      this.fileList = [];
    },
    onCreate() {
      const title = this.form.title.trim();
      if (!title) {
        ElMessage.warning(this.$t('fish.message.titleRequired'));
        return;
      }
      if (!this.form.voicesUrl) {
        ElMessage.warning(this.$t('fish.message.audioRequired'));
        return;
      }
      const payload: IFishCreatePayload = {
        title,
        voices: this.form.voicesUrl,
        visibility: this.form.visibility,
        train_mode: this.form.trainMode,
        enhance_audio_quality: this.form.enhanceAudio,
        generate_sample: this.form.generateSample
      };
      if (this.form.description.trim()) payload.description = this.form.description.trim();
      if (this.form.texts.trim()) payload.texts = [this.form.texts.trim()];

      this.creating = true;
      this.$emit('create', payload);
      // Re-enable the form shortly after so the spinner is visible but the
      // user can keep working while the create call runs in the background.
      setTimeout(() => {
        this.creating = false;
        this.form = defaultForm();
        this.fileList = [];
      }, 600);
    }
  }
});
</script>

<style lang="scss" scoped>
.field-block {
  display: flex;
  flex-direction: column;

  .title {
    font-size: 14px;
    margin: 0 0 4px 0;

    .required {
      color: var(--el-color-danger);
      margin-left: 2px;
    }
  }

  .hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 0 0 8px 0;
    line-height: 1.5;

    &.warn {
      color: var(--el-color-warning);
    }
  }

  .muted {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .title {
    font-size: 14px;
    margin: 0;
  }
}

.audio-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  :deep(.upload-wrapper .el-upload) {
    display: inline-flex;
  }
}

.ready-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
