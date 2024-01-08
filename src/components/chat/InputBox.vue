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
      :class="{
        btn: true,
        'btn-send': true,
        disabled: !question
      }"
      @click="onSubmit"
    >
      <font-awesome-icon icon="fa-solid fa-location-arrow" class="icon icon-send" />
    </span>
    <el-input
      v-model="questionValue"
      :rows="1"
      :disabled="disabled"
      class="input"
      type="textarea"
      :placeholder="$t('chat.message.newMessagePlaceholder')"
      @keydown.enter.exact.prevent="onSubmit"
    >
    </el-input>
    <p class="info">{{ $t('chat.message.howToUse') }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElMessage, ElTooltip, ElUpload } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { CHAT_MODEL_CHATGPT4_VISION, IChatModel } from '@/operators';
import { getBaseUrlData } from '@/utils';

export default defineComponent({
  name: 'InputBox',
  components: {
    ElInput,
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
  emits: ['update:question', 'update:references', 'submit'],
  data() {
    return {
      questionValue: this.question,
      fileList: [],
      uploadUrl: getBaseUrlData() + '/api/v1/files/'
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
      return [CHAT_MODEL_CHATGPT4_VISION.name].includes(this.model.name);
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
    onSubmit() {
      if (!this.question) {
        return;
      }
      this.$emit('submit');
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
.input-box {
  .input {
    textarea {
      border: none;
      background: none;
      box-shadow: none;
      resize: none;
      line-height: 30px;
      height: 40px;
    }
  }
  .el-upload-list {
    position: absolute;
    width: 400px;
    bottom: 45px;
  }

  .el-textarea.is-disabled .el-textarea__inner {
    background-color: initial;
  }
}
</style>

<style lang="scss" scoped>
.input-box {
  position: relative;
  width: 100%;
  border: 1px solid #eee;
  border-radius: 10px;
  background: none;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
  top: 30px;
  .upload {
    display: inline-block;
    &.disabled {
      .btn-upload {
        cursor: not-allowed;
        .icon-attachment {
          color: #eee;
        }
      }
    }
  }
  .input {
    border: none;
    width: calc(100% - 80px);
    margin-left: 30px;
  }
  .info {
    display: block;
    position: absolute;
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    margin-left: 3px;
  }
  .btn {
    display: block;
    z-index: 100;
    cursor: pointer;
    position: absolute;
    top: 7px;
    &.btn-upload {
      left: 10px;
      .icon-attachment {
        font-size: 14px;
        color: #666;
      }
    }
    &.btn-send {
      right: 15px;
      &.disabled {
        .icon-send {
          color: #eee;
        }
        cursor: not-allowed;
      }
      .icon-send {
        font-size: 16px;
        color: #666;
      }
    }
  }
}
</style>
