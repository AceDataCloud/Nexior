<template>
  <div class="input-box">
    <div class="tools">
      <el-upload
        v-model:file-list="fileList"
        :class="{
          upload: true,
          disabled: !_isUploadEnabled
        }"
        :disabled="!_isUploadEnabled"
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
          <span :class="{ btn: true, 'btn-upload': true, disabled: !_isUploadEnabled }">
            <font-awesome-icon icon="fa-solid fa-plus" class="icon icon-attachment" />
          </span>
        </el-tooltip>
      </el-upload>
      <span
        v-if="['chatgpt'].includes(modelGroup.name)"
        :class="{ btn: true, 'btn-search': true, active: _isSearchActive, disabled: !isSearchEnabled }"
        @click="
          _isSearchActive = !_isSearchActive;
          _isReasonActive = false;
          _isDeepsearchActive = false;
        "
      >
        <font-awesome-icon icon="fa-solid fa-globe" class="icon icon-search" />
        {{ $t('chat.button.search') }}
      </span>
      <span
        v-if="['grok'].includes(modelGroup.name)"
        :class="{ btn: true, 'btn-deepsearch': true, active: _isDeepsearchActive, disabled: !isDeepsearchEnabled }"
        @click="
          _isDeepsearchActive = !_isDeepsearchActive;
          _isReasonActive = false;
          _isSearchActive = false;
        "
      >
        <font-awesome-icon icon="fa-solid fa-globe" class="icon icon-deepsearch" />
        {{ $t('chat.button.deepsearch') }}
      </span>
      <span
        v-if="['chatgpt', 'grok', 'deepseek'].includes(modelGroup.name)"
        :class="{ btn: true, 'btn-reason': true, active: _isReasonActive, disabled: !isReasonEnabled }"
        @click="
          _isReasonActive = !_isReasonActive;
          _isDeepsearchActive = false;
        "
      >
        <font-awesome-icon icon="fa-regular fa-lightbulb" class="icon icon-reason" />
        {{ $t('chat.button.thinkDeeper') }}
      </span>
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
import { CHAT_MODEL_GROUP_DEEPSEEK, CHAT_MODEL_GROUP_GROK } from '@/constants';

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
    },
    isSearchEnabled: {
      type: Boolean,
      required: false,
      default: true
    },
    isDeepsearchEnabled: {
      type: Boolean,
      required: false,
      default: true
    },
    isReasonEnabled: {
      type: Boolean,
      required: false,
      default: true
    },
    isUploadEnabled: {
      type: Boolean,
      required: false,
      default: true
    },
    isSearchActive: {
      type: Boolean,
      required: false,
      default: false
    },
    isDeepsearchActive: {
      type: Boolean,
      required: false,
      default: false
    },
    isReasonActive: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: [
    'update:question',
    'update:references',
    'submit',
    'stop',
    'update:isSearchActive',
    'update:isReasonActive',
    'update:isUploadEnabled',
    'update:isSearchEnabled',
    'update:isReasonEnabled',
    'update:isDeepsearchEnabled',
    'update:isDeepsearchActive'
  ],
  data() {
    return {
      inputHeight: '35px', //add inputHeight
      questionValue: this.question,
      fileList: [],
      // eslint-disable-next-line vue/no-reserved-keys
      _isSearchActive: this.isSearchActive,
      // eslint-disable-next-line vue/no-reserved-keys
      _isReasonActive: this.isReasonActive,
      // eslint-disable-next-line vue/no-reserved-keys
      _isDeepsearchActive: this.isDeepsearchActive,
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
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
    },
    _isUploadEnabled() {
      return (
        !this._isSearchActive &&
        !this._isReasonActive &&
        this.modelGroup.name !== CHAT_MODEL_GROUP_DEEPSEEK.name &&
        this.modelGroup.name !== CHAT_MODEL_GROUP_GROK.name
      );
    },
    _isSearchEnabled() {
      return !this._isReasonActive && !this.isDeepsearchActive && !this.urls.length;
    },
    _isDeepsearchEnabled() {
      return !this._isReasonActive && !this._isSearchActive && !this.urls.length;
    },
    _isReasonEnabled() {
      return !this._isSearchActive && !this.isDeepsearchActive && !this.urls.length;
    },
    model(): IChatModel {
      return this.$store.state.chat.model;
    }
  },
  watch: {
    modelGroup() {
      this._isReasonActive = false;
      this._isSearchActive = false;
      this._isDeepsearchActive = false;
    },
    urls(val) {
      this.$emit('update:references', val);
    },
    _isUploadEnabled(val: boolean) {
      this.$emit('update:isUploadEnabled', val);
    },
    _isSearchEnabled(val: boolean) {
      this.$emit('update:isSearchEnabled', val);
    },
    _isDeepsearchEnabled(val: boolean) {
      this.$emit('update:isDeepsearchEnabled', val);
    },
    _isReasonEnabled(val: boolean) {
      this.$emit('update:isReasonEnabled', val);
    },
    _isSearchActive(val: boolean) {
      this.$emit('update:isSearchActive', val);
    },
    _isDeepsearchActive(val: boolean) {
      console.log('deepsearch', val);
      this.$emit('update:isDeepsearchActive', val);
    },
    _isReasonActive(val: boolean) {
      this.$emit('update:isReasonActive', val);
    },
    questionValue(val: string) {
      this.$emit('update:question', val);
    },
    question(val: string) {
      if (val !== this.questionValue) {
        this.questionValue = val;
      }
    },
    isReasonActive(val: boolean) {
      if (val !== this._isReasonActive) {
        this._isReasonActive = val;
      }
    },
    isSearchActive(val: boolean) {
      if (val !== this._isSearchActive) {
        this._isSearchActive = val;
      }
    },
    isDeepsearchActive(val: boolean) {
      if (val !== this._isDeepsearchActive) {
        this._isDeepsearchActive = val;
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
      &.btn-search {
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
      &.btn-deepsearch {
        color: var(--el-text-color-primary);
        border-radius: 20px;
        padding: 0 10px;
        font-size: 16px;
        &.active {
          border: 1px solid var(--el-color-primary);
          color: var(--el-color-primary);
        }
        .icon-deepsearch {
          font-size: 16px;
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
