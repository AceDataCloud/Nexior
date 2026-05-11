<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <div class="field mb-4">
        <h2 class="title font-bold">{{ $t('fish.name.voiceTitle') }}</h2>
        <el-input v-model="title" class="value" :placeholder="$t('fish.placeholder.voiceTitle')" maxlength="60" />
      </div>

      <div class="field-block mb-4">
        <div class="flex justify-between items-center mb-2">
          <h2 class="title font-bold">{{ $t('fish.name.referenceAudio') }}</h2>
          <el-upload
            v-model:file-list="fileList"
            name="file"
            :limit="1"
            class="upload-wrapper inline-upload"
            :action="uploadUrl"
            accept=".mp3,.wav,.m4a,audio/*"
            :show-file-list="false"
            :on-exceed="onExceed"
            :on-error="onError"
            :on-success="onSuccess"
            :before-upload="onBeforeUpload"
            :headers="headers"
          >
            <el-button round type="primary" size="small" :loading="uploading">
              <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
              {{ $t('fish.button.uploadAudio') }}
            </el-button>
          </el-upload>
        </div>
        <p class="hint">{{ $t('fish.description.uploadAudio') }}</p>
        <div v-if="audioUrl" class="mt-2">
          <audio :src="audioUrl" controls preload="metadata" class="w-full" />
        </div>
      </div>

      <div class="field-block mb-4">
        <h2 class="title font-bold mb-2">{{ $t('fish.name.voiceDescription') }}</h2>
        <el-input
          v-model="description"
          class="value"
          type="textarea"
          :rows="3"
          :placeholder="$t('fish.placeholder.voiceDescription')"
          maxlength="500"
        />
      </div>
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <el-button type="primary" class="btn w-full" round :disabled="!canCreate" :loading="creating" @click="onCreate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('fish.button.createModel') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElInput, ElMessage, ElUpload, UploadFiles, UploadFile } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';

const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

interface IData {
  title: string;
  description: string;
  audioUrl: string;
  fileList: UploadFiles;
  uploading: boolean;
  creating: boolean;
}

export default defineComponent({
  name: 'FishModelConfigPanel',
  components: {
    ElButton,
    ElInput,
    ElUpload,
    FontAwesomeIcon
  },
  emits: ['create'],
  data(): IData {
    return {
      title: '',
      description: '',
      audioUrl: '',
      fileList: [],
      uploading: false,
      creating: false
    };
  },
  computed: {
    uploadUrl(): string {
      return getBaseUrlPlatform() + '/api/v1/files/';
    },
    headers(): Record<string, string> {
      return {
        Authorization: `Bearer ${this.$store.state.token?.access}`
      };
    },
    canCreate(): boolean {
      return !!this.title.trim() && !!this.audioUrl && !this.uploading && !this.creating;
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
    onError() {
      this.uploading = false;
      ElMessage.error(this.$t('fish.message.uploadError'));
    },
    onSuccess(response: { file_url?: string } | undefined, _file: UploadFile, fileList: UploadFiles) {
      this.uploading = false;
      const url = response?.file_url;
      if (!url) {
        ElMessage.error(this.$t('fish.message.uploadError'));
        this.fileList = [];
        return;
      }
      this.audioUrl = url;
      this.fileList = fileList;
    },
    onCreate() {
      const title = this.title.trim();
      if (!title) {
        ElMessage.warning(this.$t('fish.message.titleRequired'));
        return;
      }
      if (!this.audioUrl) {
        ElMessage.warning(this.$t('fish.message.audioRequired'));
        return;
      }
      this.creating = true;
      this.$emit('create', {
        title,
        voices: this.audioUrl,
        description: this.description?.trim() || undefined,
        visibility: 'unlist' as const
      });
      // Optimistically reset after emit; parent's create promise can run in
      // the background. We re-enable the form on next tick so the spinner
      // shows for a moment without locking the user out.
      setTimeout(() => {
        this.creating = false;
        this.title = '';
        this.description = '';
        this.audioUrl = '';
        this.fileList = [];
      }, 400);
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }

  .value {
    flex: 1;
  }
}

.field-block {
  display: flex;
  flex-direction: column;

  .title {
    font-size: 14px;
  }

  .hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 4px 0 0 0;
  }
}

.upload-wrapper.inline-upload {
  :deep(.el-upload) {
    display: inline-flex;
  }
}
</style>
