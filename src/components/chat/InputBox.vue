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
      :limit="10"
      :multiple="false"
      :action="uploadUrl"
      :on-exceed="onExceed"
      :on-error="onError"
      :headers="headers"
    >
      <el-tooltip class="box-item" effect="dark" :content="$t('chat.message.uploadFile')" placement="bottom">
        <span class="btn btn-upload">
          <font-awesome-icon icon="fa-solid fa-plus" class="icon icon-attachment" />
        </span>
      </el-tooltip>
    </el-upload>
    <span :class="{ btn: true, 'btn-search': true, active: search, disabled: !canSearch }" @click="search = !search">
      <font-awesome-icon icon="fa-solid fa-globe" class="icon icon-search" />
      {{ $t('chat.button.search') }}
    </span>
    <span :class="{ btn: true, 'btn-reason': true, active: reason, disabled: !canReason }" @click="reason = !reason">
      <font-awesome-icon icon="fa-regular fa-lightbulb" class="icon icon-reason" />
      {{ $t('chat.button.thinkDeeper') }}
    </span>
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElTooltip, ElUpload } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IChatModel } from '@/models';
import { getBaseUrlPlatform } from '@/utils';

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
  emits: ['update:question', 'update:references', 'submit', 'stop', 'update:search', 'update:reason'],
  data() {
    return {
      inputHeight: '35px', //add inputHeight
      questionValue: this.question,
      fileList: [],
      search: false,
      reason: false,
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
      return !this.search && !this.reason;
    },
    canSearch() {
      return !this.reason && !this.urls.length;
    },
    canReason() {
      return !this.search && !this.urls.length;
    },
    model(): IChatModel {
      return this.$store.state.chat.model;
    }
  },
  watch: {
    urls(val) {
      this.$emit('update:references', val);
    },
    search(val: boolean) {
      this.$emit('update:search', val);
    },
    reason(val: boolean) {
      this.$emit('update:reason', val);
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
    width: 100%;
    bottom: 135px;
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
  border: 1px solid var(--el-border-color-lighter);
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
    width: calc(100% - 16px);
    margin-left: 8px;
    margin-top: 5px;
    font-size: 16px;
    margin-bottom: 50px;
  }
  .btn {
    display: block;
    z-index: 100;
    cursor: pointer;
    border: 1px solid var(--el-border-color-lighter);
    width: fit-content;
    position: absolute;
    bottom: 15px;
    height: 36px;
    line-height: 36px;
    user-select: none;
    &.disabled {
      cursor: not-allowed;
      pointer-events: none;
      color: var(--el-text-color-disabled) !important;
    }
    &.btn-upload {
      left: 15px;
      border-radius: 50%;
      width: 36px;
      text-align: center;
      color: var(--el-text-color-secondary);
      .icon-attachment {
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }
    &.btn-search {
      left: 60px;
      color: var(--el-text-color-primary);
      border-radius: 20px;
      padding: 0 10px;
      font-size: 16px;
      &.active {
        border: 1px solid var(--el-color-primary);
        color: var(--el-color-primary);
      }
      .icon-search {
        font-size: 16px;
      }
    }
    &.btn-reason {
      left: 145px;
      color: var(--el-text-color-primary);
      border-radius: 20px;
      padding: 0 10px;
      font-size: 16px;
      &.active {
        border: 1px solid var(--el-color-primary);
        color: var(--el-color-primary);
      }
      .icon-reason {
        font-size: 16px;
      }
    }
    &.btn-send {
      bottom: 15px;
      right: 15px;
      border-radius: 50%;
      width: 36px;
      text-align: center;
      background-color: var(--el-color-black);
      color: var(--el-color-white);
      font-size: 16px;
      &.disabled {
        display: none;
        cursor: not-allowed;
      }
    }
    &.btn-stop {
      bottom: 15px;
      right: 15px;
      border-radius: 50%;
      width: 36px;
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
}
</style>
