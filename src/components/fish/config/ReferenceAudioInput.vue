<template>
  <div class="reference-input">
    <div class="field-block mb-3">
      <div class="flex items-baseline justify-between mb-1">
        <h2 class="title font-bold">{{ $t('fish.name.referenceAudio') }} <span class="required">*</span></h2>
      </div>
      <p class="hint">{{ $t('fish.description.instantReferenceAudio') }}</p>
      <div v-if="!value?.audio" class="audio-actions">
        <el-upload
          v-model:file-list="fileList"
          name="file"
          :limit="1"
          class="upload-wrapper"
          :action="uploadUrl"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          :show-file-list="false"
          :on-exceed="onExceed"
          :on-error="onUploadError"
          :on-success="onUploadSuccess"
          :before-upload="onBeforeUpload"
          :headers="uploadHeaders"
        >
          <el-button type="primary" plain round :loading="uploading">
            <upload-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('fish.button.uploadAudio') }}
          </el-button>
        </el-upload>
      </div>
      <div v-if="value?.audio" class="mt-2">
        <audio :src="value.audio" controls preload="metadata" class="w-full" />
        <el-button link size="small" @click="clear">
          <undo-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('fish.button.replaceAudio') }}
        </el-button>
      </div>
    </div>
    <div class="field-block">
      <h2 class="title font-bold">{{ $t('fish.name.referenceTranscript') }} <span class="required">*</span></h2>
      <p class="hint">{{ $t('fish.description.referenceTranscript') }}</p>
      <el-input
        :model-value="value?.text || ''"
        type="textarea"
        :rows="2"
        maxlength="10000"
        :placeholder="$t('fish.placeholder.referenceTranscript')"
        @update:model-value="updateText"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { UndoIcon, UploadIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, PropType } from 'vue';
import { ElButton, ElInput, ElMessage, ElUpload, UploadFile, UploadFiles } from 'element-plus';
import { IFishReference } from '@/models';
import { getBaseUrlPlatform, uploadTrackerMixin } from '@/utils';

const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;

export default defineComponent({
  name: 'FishReferenceAudioInput',
  components: { ElButton, ElInput, ElUpload, UndoIcon, UploadIcon },
  mixins: [uploadTrackerMixin],
  props: {
    modelValue: { type: Object as PropType<IFishReference | undefined>, default: undefined }
  },
  emits: ['update:modelValue'],
  data() {
    return { fileList: [] as UploadFiles, uploading: false };
  },
  computed: {
    value(): IFishReference | undefined {
      return this.modelValue;
    },
    uploadUrl(): string {
      return `${getBaseUrlPlatform()}/api/v1/files/`;
    },
    uploadHeaders(): Record<string, string> {
      return { Authorization: `Bearer ${this.$store.state.token?.access}` };
    }
  },
  methods: {
    onBeforeUpload(file: File): boolean {
      const validType = /\.(mp3|wav)$/i.test(file.name);
      if (!validType) {
        ElMessage.warning(this.$t('fish.message.instantAudioFormat'));
        return false;
      }
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
    onUploadSuccess(response: { file_url?: string } | undefined, _file: UploadFile, files: UploadFiles) {
      this.uploading = false;
      if (!response?.file_url) {
        this.fileList = [];
        ElMessage.error(this.$t('fish.message.uploadError'));
        return;
      }
      this.fileList = files;
      this.emitValue(response.file_url, this.value?.text || '');
    },
    updateText(text: string) {
      this.emitValue(this.value?.audio || '', text);
    },
    clear() {
      this.fileList = [];
      this.$emit('update:modelValue', undefined);
    },
    emitValue(audio: string, text: string) {
      this.$emit('update:modelValue', { audio, text });
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin: 0 0 4px;
}
.required {
  color: var(--el-color-danger);
}
.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 8px;
}
.field-block {
  display: flex;
  flex-direction: column;
}
.audio-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
