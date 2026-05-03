<template>
  <div class="composer">
    <!-- Hidden el-upload: only used for its file-picker + upload pipeline.
         The file list is rendered separately above the textarea (see
         .file-previews below) and the trigger is fired programmatically
         from the + popover. -->
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      class="upload-hidden"
      :accept="extensions"
      :disabled="(!isFileSupported && !isImageSupported) || answering"
      name="file"
      :limit="10"
      :multiple="true"
      :action="uploadUrl"
      :show-file-list="false"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-progress="onProgress"
      :headers="headers"
    >
      <span ref="uploadTrigger" class="upload-trigger" aria-hidden="true"></span>
    </el-upload>
    <div v-if="fileList.length > 0" class="file-previews">
      <template v-for="file in fileList" :key="file.uid">
        <image-preview
          v-if="isImageUrl(file.name)"
          :url="file.url || (file.response as any)?.file_url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
        <file-preview
          v-else
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
    </div>
    <textarea
      ref="textarea"
      v-model="questionValue"
      :disabled="answering"
      class="input"
      :placeholder="$t('chat.message.newMessagePlaceholder')"
      :style="{ height: inputHeight }"
      @keydown.enter.exact.prevent="onSubmit"
      @input="adjustTextareaHeight"
    ></textarea>
    <div class="tools">
      <el-dropdown trigger="click" placement="top-start" :hide-on-click="true" popper-class="composer-plus-popper">
        <el-tooltip class="box-item" effect="dark" :content="$t('chat.composer.addAction')" placement="top">
          <span :class="{ btn: true, 'btn-plus': true, disabled: answering }" :aria-disabled="answering" role="button">
            <font-awesome-icon icon="fa-solid fa-plus" class="icon icon-plus" />
          </span>
        </el-tooltip>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :disabled="(!isFileSupported && !isImageSupported) || answering" @click="onTriggerUpload">
              <font-awesome-icon icon="fa-regular fa-file-alt" class="menu-icon" />
              <span>{{ $t('chat.composer.addFiles') }}</span>
            </el-dropdown-item>
            <el-dropdown-item @click="onOpenSkills">
              <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" class="menu-icon" />
              <span>{{ $t('chat.composer.skills') }}</span>
              <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="menu-external" />
            </el-dropdown-item>
            <el-dropdown-item @click="onOpenConnections">
              <font-awesome-icon icon="fa-solid fa-plug" class="menu-icon" />
              <span>{{ $t('chat.composer.connections') }}</span>
              <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="menu-external" />
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <el-button
      :disabled="answering || !questionValue || uploading || !ready"
      type="primary"
      :class="{
        btn: true,
        'btn-send': true
      }"
      @click="onSubmit"
    >
      <font-awesome-icon icon="fa-solid fa-arrow-up" class="icon icon-send" />
    </el-button>
    <el-button
      v-show="answering"
      :disabled="!answering"
      type="primary"
      :class="{
        btn: true,
        'btn-stop': true
      }"
      @click="onStop"
    >
      <font-awesome-icon icon="fa-solid fa-stop" class="icon icon-stop" />
    </el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElMessage,
  ElTooltip,
  ElUpload,
  UploadFile,
  UploadProgressEvent,
  ElButton,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IChatModel } from '@/models';
import { getBaseUrlPlatform, isImageUrl, pasteUploadMixin } from '@/utils';
import FilePreview from '@/components/common/FilePreview.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';

export default defineComponent({
  name: 'Composer',
  components: {
    FilePreview,
    ImagePreview,
    ElTooltip,
    FontAwesomeIcon,
    ElUpload,
    ElButton,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem
  },
  mixins: [pasteUploadMixin],
  props: {
    answering: {
      type: Boolean,
      required: false,
      default: false
    },
    ready: {
      type: Boolean,
      required: false,
      default: true
    },
    references: {
      type: Array,
      required: false,
      default: () => []
    },
    question: {
      type: String,
      required: true
    }
  },
  emits: ['update:question', 'update:references', 'submit', 'stop'],
  data() {
    return {
      inputHeight: '35px',
      questionValue: this.question || '',
      fileList: [] as UploadFile[],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    model(): IChatModel {
      return this.$store.state.chat.model;
    },
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    },
    isFileSupported() {
      return this.model?.isFileSupported;
    },
    isImageSupported() {
      return this.model?.isImageSupported;
    },
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    urls(): string[] {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    uploading() {
      // if at least file is uploading, return true
      return !!this.fileList.find(
        (file) => file.percentage !== undefined && file.percentage >= 0 && file.percentage < 100
      );
    },
    extensions() {
      if (this.isFileSupported === false && this.isImageSupported === true) {
        return '.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.tiff,.ico,.heic';
      }
      return undefined;
    },
    pasteAccept(): string {
      // Restrict clipboard paste to images (still useful even when other file
      // types are supported). The upload control itself will continue to
      // accept anything via the file picker.
      return '.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.tiff,.ico,.heic,image/*';
    }
  },
  watch: {
    urls(val) {
      console.debug('File URLs:', val);
      if (val.length > 0) {
        this.$emit('update:references', val);
      }
    },
    questionValue(val: string) {
      this.$emit('update:question', val.trim());
    },
    question(val: string) {
      if (val !== this.questionValue) {
        this.questionValue = val;
      }
    },
    references(val: string[]) {
      console.debug('References updated:', val);
      if (val.length === 0) {
        this.fileList = [];
      }
    },
    isFileSupported(val, oldVal) {
      if (oldVal && !val) {
        this.fileList = [];
      }
    }
  },
  methods: {
    isImageUrl,
    // add textarea method
    adjustTextareaHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.textarea;
        if (textarea) {
          // @ts-ignore
          textarea.style.height = '35px';
          // @ts-ignore
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      });
    },
    onSubmit() {
      if (!this.question || this.uploading || !this.ready) {
        return;
      }
      this.$emit('submit');
    },
    onStop() {
      this.$emit('stop');
    },
    onProgress(event: UploadProgressEvent, uploadFile: UploadFile) {
      console.debug('File upload progress:', uploadFile.name, event.loaded, event.total, uploadFile.percentage);
    },
    onExceed() {
      ElMessage.warning(this.$t('chat.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('chat.message.uploadReferencesError'));
    },
    onTriggerUpload() {
      if ((!this.isFileSupported && !this.isImageSupported) || this.answering) {
        return;
      }
      // Programmatically open the native file picker that el-upload owns.
      // We hide el-upload's UI and render the file list ourselves above
      // the textarea, so the dropdown menu item has to forward the click
      // to el-upload's <input type="file">.
      this.$nextTick(() => {
        const root = (this.$refs.uploader as any)?.$el as HTMLElement | undefined;
        const input =
          (root?.querySelector('input.el-upload__input') as HTMLInputElement | null) ||
          (root?.querySelector('input[type="file"]') as HTMLInputElement | null);
        input?.click();
      });
    },
    onOpenSkills() {
      // Skills are managed exclusively at auth.acedata.cloud/user/skills.
      // Nexior is a thin entry point - clicking opens the canonical
      // management page in a new tab.
      window.open('https://auth.acedata.cloud/user/skills', '_blank', 'noopener');
    },
    onOpenConnections() {
      // Connections (MCP + OAuth connectors) are managed exclusively at
      // auth.acedata.cloud/user/connections.
      window.open('https://auth.acedata.cloud/user/connections', '_blank', 'noopener');
    }
  }
});
</script>

<style lang="scss">
textarea.input {
  font-size: 14px;
  min-height: 55px;
  max-height: 150px;
  border: none;
  background: none;
  box-shadow: none;
  resize: none;
  line-height: 25px;
  width: calc(100% - 80px);
  font-family: var(--el-font-family);
  padding-top: 6px;
}
textarea.input:focus {
  outline: none;
}
.composer {
  position: relative;
  .input {
    textarea {
      max-height: 100px;
      border: none;
      background: none;
      box-shadow: none;
      resize: none;
      line-height: 35px;
    }
  }

  .el-textarea.is-disabled .el-textarea__inner {
    background-color: initial;
  }
}
.composer-plus-popper {
  .menu-icon {
    width: 16px;
    margin-right: 8px;
    color: var(--el-text-color-regular);
  }
  .menu-external {
    margin-left: 8px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
}
</style>

<style lang="scss" scoped>
.composer {
  width: 100%;
  max-width: 800px;
  margin: auto;
  position: relative;
  border-radius: 22px;
  background-color: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary-light-9) 6%);
  box-shadow: var(--app-shadow-md);
  padding: 6px;

  .upload-hidden {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .upload-trigger {
    display: block;
    width: 0;
    height: 0;
  }
  .file-previews {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 0;
    margin-bottom: 4px;
  }
  .input {
    border: none;
    width: calc(100% - 16px);
    margin-left: 8px;
    margin-top: 5px;
    font-size: 16px;
    margin-bottom: 50px;
  }
  .tools {
    position: absolute;
    left: 12px;
    bottom: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      &.btn-plus {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
        font-size: 16px;
        transition: background-color 0.15s ease;
        &:hover {
          background-color: var(--el-fill-color);
        }
        &.disabled {
          cursor: not-allowed;
          color: var(--el-text-color-disabled) !important;
          background-color: var(--el-fill-color-lighter);
          .icon-plus {
            color: var(--el-text-color-disabled) !important;
          }
        }
        .icon-plus {
          font-size: 16px;
        }
      }
    }
  }
  .btn-send,
  .btn-stop {
    --el-button-bg-color: var(--el-color-primary);
    --el-button-border-color: var(--el-color-primary);
    --el-button-outline-color: var(--el-color-primary-dark-2);
    --el-button-active-color: var(--el-color-primary-dark-2);
    --el-button-hover-text-color: var(--el-color-white);
    --el-button-hover-link-text-color: var(--el-color-primary-dark-2);
    --el-button-hover-bg-color: var(--el-color-primary-dark-2);
    --el-button-hover-border-color: var(--el-color-primary-dark-2);
    --el-button-active-bg-color: var(--el-color-primary-dark-2);
    --el-button-active-border-color: var(--el-color-primary-dark-2);
    --el-button-disabled-text-color: var(--el-color-white);
    --el-button-disabled-bg-color: var(--el-color-primary-light-5);
    --el-button-disabled-border-color: var(--el-color-primary-light-5);
    position: absolute;
    bottom: 12px;
    right: 12px;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    line-height: 36px;
    text-align: center;
    font-size: 16px;
    transition: box-shadow 0.2s ease;
    &:hover:not(:disabled) {
      box-shadow: 0 0 16px rgba(39, 113, 134, 0.3);
    }
  }
}

@media (max-width: 767px) {
  .composer {
    border-radius: 18px;
    .input {
      margin-bottom: 46px;
      font-size: 15px;
    }

    .tools {
      left: 10px;
      bottom: 10px;
      .btn.btn-plus {
        width: 32px;
        height: 32px;
        font-size: 14px;
      }
    }

    .btn-send,
    .btn-stop {
      right: 10px;
      bottom: 10px;
      width: 32px;
      height: 32px;
    }
  }
}
</style>
