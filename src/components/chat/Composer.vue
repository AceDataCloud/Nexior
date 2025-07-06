<template>
  <div class="composer">
    <div class="tools">
      <el-upload
        v-model:file-list="fileList"
        :class="{
          upload: true,
          disabled: !model.isFileSupported || disabled
        }"
        :disabled="!model.isFileSupported || disabled"
        name="file"
        :limit="10"
        :multiple="true"
        :action="uploadUrl"
        list-type="picture"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-progress="onProgress"
        :headers="headers"
      >
        <template #file="{ file }">
          <image-preview
            v-if="isImageUrl(file.name)"
            :url="file.url || file.response?.file_url"
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
        <el-tooltip class="box-item" effect="dark" :content="$t('chat.message.uploadFile')" placement="bottom">
          <span :class="{ btn: true, 'btn-upload': true, disabled: !model.isFileSupported || disabled }">
            <font-awesome-icon icon="fa-solid fa-plus" class="icon icon-attachment" />
          </span>
        </el-tooltip>
      </el-upload>
    </div>
    <span
      v-show="!disabled"
      :class="{
        btn: true,
        'btn-send': true,
        disabled: !questionValue
      }"
      @click="onSubmit"
    >
      <font-awesome-icon icon="fa-solid fa-location-arrow" class="icon icon-send" />
    </span>
    <span
      v-show="disabled"
      :class="{
        btn: true,
        'btn-stop': true,
        disabled: !disabled
      }"
      @click="onStop"
    >
      <font-awesome-icon icon="fa-solid fa-stop" class="icon icon-stop" />
    </span>
    <textarea
      ref="textarea"
      v-model="questionValue"
      :disabled="disabled"
      class="input"
      :placeholder="$t('chat.message.newMessagePlaceholder')"
      :style="{ height: inputHeight }"
      @keydown.enter.exact.prevent="onSubmit"
      @input="adjustTextareaHeight"
    ></textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElTooltip, ElUpload, UploadFile, UploadFiles, UploadProgressEvent } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IChatModel } from '@/models';
import { getBaseUrlPlatform, isImageUrl } from '@/utils';
import FilePreview from './FilePreview.vue';
import ImagePreview from './ImagePreview.vue';

export default defineComponent({
  name: 'Composer',
  components: {
    FilePreview,
    ImagePreview,
    ElTooltip,
    FontAwesomeIcon,
    ElUpload
  },
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false
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
      questionValue: this.question,
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
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    urls(): string[] {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
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
      this.$emit('update:question', val);
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
      if (!this.question) {
        return;
      }
      this.$emit('submit');
    },
    onStop() {
      this.$emit('stop');
    },
    onProgress(evt: UploadProgressEvent, uploadFile: UploadFile, uploadFiles: UploadFiles) {
      console.debug('File upload progress:', uploadFile.name, evt.loaded, evt.total);
    },
    onExceed() {
      ElMessage.warning(this.$t('chat.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('chat.message.uploadReferencesError'));
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
  .el-upload-list {
    position: absolute;
    bottom: -5px;
    left: 50px;
    height: 50px;
    width: 700px;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    overflow-x: auto;
    gap: 5px;
    overflow-y: scroll;
    flex-wrap: wrap;
    .el-upload-list__item {
      margin: 0;
      width: fit-content;
      height: 50px;
      padding: 0;
      border-radius: 10px;
      position: relative;
    }
  }

  .el-textarea.is-disabled .el-textarea__inner {
    background-color: initial;
  }
}
</style>

<style lang="scss" scoped>
.composer {
  width: 100%;
  max-width: 800px;
  margin: auto;
  position: relative;
  border-radius: 20px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 5px;
  .upload {
    display: inline-block;
    &.disabled {
      .btn-upload {
        cursor: not-allowed;
        pointer-events: none;
        color: var(--el-text-color-disabled) !important;
        .icon-attachment {
          color: var(--el-text-color-disabled) !important;
        }
      }
    }
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
    left: 15px;
    bottom: 15px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    .btn {
      display: block;
      margin-right: 10px;
      z-index: 100;
      cursor: pointer;
      border: 1px solid var(--el-border-color-lighter);
      width: fit-content;
      height: 36px;
      line-height: 36px;
      user-select: none;
      &.disabled {
        cursor: not-allowed;
        pointer-events: none;
        color: var(--el-text-color-disabled) !important;
      }
      &.btn-upload {
        border-radius: 50%;
        width: 36px;
        text-align: center;
        color: var(--el-text-color-secondary);
        .icon-attachment {
          font-size: 16px;
          color: var(--el-text-color-primary);
        }
      }
    }
  }
  .btn-send,
  .btn-stop {
    position: absolute;
    bottom: 15px;
    right: 15px;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    line-height: 36px;
    text-align: center;
    background-color: var(--el-color-black);
    color: var(--el-color-white);
    font-size: 16px;
    &.disabled {
      display: none;
      cursor: not-allowed;
    }
  }
}
</style>
