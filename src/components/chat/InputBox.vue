<template>
  <div class="input-box">
    <el-upload
      v-model:file-list="fileList"
      :class="{
        upload: true,
        disabled: !canUpload
      }"
      :disabled="!canUpload"
      name="file"
      :show-file-list="true"
      :limit="1"
      :multiple="false"
      :action="uploadUrl"
      :on-exceed="onExceed"
      :on-error="onError"
      :headers="headers"
    >
      <el-tooltip class="box-item" effect="dark" :content="$t('chat.message.uploadFile')" placement="top">
        <span class="btn btn-upload">
          <font-awesome-icon icon="fa-solid fa-paperclip" class="icon icon-attachment" />
        </span>
      </el-tooltip>
    </el-upload>
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
      <font-awesome-icon icon="fa-solid fa-stop-circle" class="icon icon-stop" />
    </span>
    <!-- add this textarea -->
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
  <p class="info">{{ $t('chat.message.howToUse') }}</p>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElTooltip, ElUpload } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IChatModel } from '@/models';
import { getBaseUrlPlatform } from '@/utils';
import { CHAT_MODEL_GPT_4_ALL, CHAT_MODEL_GPT_4_VISION } from '@/constants';

export default defineComponent({
  name: 'InputBox',
  components: {
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
      inputHeight: '35px', //add inputHeight
      questionValue: this.question,
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    urls(): string[] {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    canUpload() {
      return [CHAT_MODEL_GPT_4_VISION.name, CHAT_MODEL_GPT_4_ALL.name].includes(this.model.name);
    },
    model(): IChatModel {
      return this.$store.state.chat.model;
    }
  },
  watch: {
    urls(val) {
      this.$emit('update:references', val);
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
      if (val.length === 0) {
        this.fileList = [];
      }
    }
  },
  methods: {
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
  min-height: 35px;
  max-height: 350px;
  border: none;
  background: none;
  box-shadow: none;
  resize: none;
  line-height: 25px;
  width: calc(100% - 80px);
  margin-left: 30px;
  font-family: var(--el-font-family);
  padding-top: 6px;
}
textarea.input:focus {
  outline: none;
}
.input-box {
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
    width: 400px;
    bottom: 55px;
  }

  .el-textarea.is-disabled .el-textarea__inner {
    background-color: initial;
  }
}
</style>

<style lang="scss" scoped>
.input-box {
  width: 100%;
  max-width: 800px;
  margin: auto;
  position: relative;
  border-radius: 20px;
  background: var(--el-bg-color-page);
  padding: 5px;
  .upload {
    display: inline-block;
    &.disabled {
      .btn-upload {
        cursor: not-allowed;
        .icon-attachment {
          color: var(--el-text-color-disabled);
        }
      }
    }
  }
  .input {
    border: none;
    width: calc(100% - 80px);
    margin-left: 35px;
  }
  .btn {
    display: block;
    z-index: 100;
    cursor: pointer;
    bottom: 15px;
    position: absolute;
    &.btn-upload {
      left: 15px;
      .icon-attachment {
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }
    &.btn-send {
      right: 15px;
      &.disabled {
        .icon-send {
          color: var(--el-text-color-disabled);
        }
        cursor: not-allowed;
      }
      .icon-send {
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }
    &.btn-stop {
      right: 15px; // Adjust position if needed
      &.disabled {
        .icon-stop {
          color: var(--el-text-color-disabled);
        }
        cursor: not-allowed;
      }
      .icon-stop {
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }
  }
}

.info {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
  text-align: center;
  margin-bottom: 0;
}
</style>
