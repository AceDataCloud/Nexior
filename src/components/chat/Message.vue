<template>
  <div
    :class="{
      message: true,
      [message.role as string]: true
    }"
    :role="message.role"
  >
    <div class="author">
      <el-image v-if="message.role === 'assistant'" :src="modelGroup?.icon" fit="cover" class="avatar" />
    </div>
    <div v-if="!errorText" class="main">
      <div
        v-motion
        :initial="{ opacity: 0, y: 5 }"
        :enter="{ opacity: 1, y: 0, scale: 1 }"
        :delay="300"
        :duration="400"
        :layout="true"
        :transition="{
          enter: { delay: 0.3, duration: 0.5 },
          layout: { duration: 0.4, easing: 'ease-in-out' }
        }"
        class="content"
      >
        <div v-if="!isEditing" class="message-content">
          <div v-if="!Array.isArray(message.content)">
            <markdown-renderer v-if="message.role === 'assistant'" :content="message?.content" />
            <pre v-else class="whitespace-pre-wrap break-words w-fit max-w-full py-1">{{ message.content }}</pre>
          </div>
          <div v-else>
            <div v-for="(item, index) in message.content" :key="index">
              <img
                v-if="item.type === 'image_url'"
                :src="typeof item?.image_url === 'string' ? item.image_url : item.image_url?.url"
                fit="cover"
                class="image"
              />
              <file-preview
                v-if="item.file_url"
                :name="typeof item?.file_url === 'string' ? item.file_url : item.file_url?.url"
                :percentage="0"
                :closable="false"
                class="mt-2"
              />
              <div v-if="item.type === 'text'">
                <markdown-renderer v-if="message.role === 'assistant'" :content="item.text" />
                <pre v-else class="whitespace-pre-wrap break-words w-fit max-w-full py-1">{{ item.text?.trim() }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="edits">
          <el-input
            v-model="questionValue"
            type="textarea"
            class="mb-2"
            @keydown.enter.exact.prevent="onEdit"
          ></el-input>
          <div class="flex justify-end">
            <el-button round @click="cancelEdit">{{ $t('common.button.cancel') }}</el-button>
            <el-button type="primary" class="btn-confirm" round @click="onEdit">{{
              $t('common.button.confirm')
            }}</el-button>
          </div>
        </div>
        <answering-mark v-if="message.state === messageState.PENDING" />
      </div>
      <div
        v-motion
        :initial="{ opacity: 0, y: 5 }"
        :enter="{ opacity: 1, y: 0, scale: 1 }"
        :delay="300"
        :duration="400"
        :layout="true"
        :transition="{
          enter: { delay: 0.3, duration: 0.5 },
          layout: { duration: 0.4, easing: 'ease-in-out' }
        }"
        class="operations"
      >
        <edit-message
          v-if="message.role === 'user' && !isEditing && !Array.isArray(message.content)"
          class="btn-edit"
          @click="startEditing"
        />
        <copy-to-clipboard
          v-if="
            !Array.isArray(message.content) &&
            (message.state === messageState.FINISHED || message.state === messageState.FAILED)
          "
          :content="message.content!"
          class="btn-copy"
        />
        <restart-to-generate
          v-if="
            !Array.isArray(message.content) &&
            (message.state === messageState.FINISHED || message.state === messageState.FAILED) &&
            message.role === 'assistant' &&
            message === messages[messages.length - 1]
          "
          class="btn-restart"
          :messages="messages"
          @restart="onRestart"
        />
      </div>
    </div>
    <div v-else class="error-card">
      <div class="error-content">
        <font-awesome-icon icon="fa-solid fa-circle-exclamation" class="error-icon" />
        <span class="error-text">{{ errorText }}</span>
      </div>
      <el-button v-if="showBuyMore" round type="primary" class="btn-topup" size="small" @click="onBuyMore">
        {{ $t('common.button.buyMore') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AnsweringMark from './AnsweringMark.vue';
import copy from 'copy-to-clipboard';
import { ElButton, ElImage, ElInput } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { IApplication, IChatMessage, IChatMessageState } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import RestartToGenerate from './RestartToGenerate.vue';
import EditMessage from './EditMessage.vue';
import FilePreview from '@/components/common/FilePreview.vue';
import {
  ERROR_CODE_API_ERROR,
  ERROR_CODE_BAD_REQUEST,
  ERROR_CODE_CONTENT_TOO_LARGE,
  ERROR_CODE_NOT_APPLIED,
  ERROR_CODE_TIMEOUT,
  ERROR_CODE_TOO_MANY_REQUESTS,
  ERROR_CODE_UNKNOWN,
  ERROR_CODE_USED_UP,
  ERROR_CODE_CANCELED,
  ROLE_ASSISTANT,
  ERROR_CODE_BUSY
} from '@/constants';
import { ROUTE_CONSOLE_APPLICATION_EXTRA } from '@/router';

interface IData {
  copied: boolean;
  isEditing: boolean;
  questionValue: string;
  messageState: typeof IChatMessageState;
}

export default defineComponent({
  name: 'Message',
  components: {
    EditMessage,
    CopyToClipboard,
    RestartToGenerate,
    AnsweringMark,
    MarkdownRenderer,
    FilePreview,
    ElButton,
    ElImage,
    ElInput,
    FontAwesomeIcon
  },
  props: {
    messages: {
      type: Array,
      required: false,
      default: () => []
    },
    message: {
      type: Object as () => IChatMessage,
      required: true
    },
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    }
  },
  emits: ['stop', 'edit', 'restart'],
  data(): IData {
    return {
      copied: false,
      isEditing: false,
      questionValue: this.message.content as string,
      messageState: IChatMessageState
    };
  },
  computed: {
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    },
    errorText() {
      console.debug('error', this.message.error);
      if (!this.message.error || !this.message.error?.code) {
        return undefined;
      }
      if (this.message.error?.message) {
        return this.message.error.message;
      }
      switch (this.message.error?.code) {
        case ERROR_CODE_USED_UP:
          return this.$t('chat.message.errorUsedUp');
        case ERROR_CODE_API_ERROR:
          return this.$t('chat.message.errorApiError');
        case ERROR_CODE_BAD_REQUEST:
          return this.$t('chat.message.errorBadRequest');
        case ERROR_CODE_TIMEOUT:
          return this.$t('chat.message.errorTimeout');
        case ERROR_CODE_BUSY:
          return this.$t('chat.message.errorBusy');
        case ERROR_CODE_CONTENT_TOO_LARGE:
          return this.$t('chat.message.errorContentTooLarge');
        case ERROR_CODE_TOO_MANY_REQUESTS:
          return this.$t('chat.message.errorTooManyRequests');
        case ERROR_CODE_NOT_APPLIED:
          return this.$t('chat.message.errorNotApplied');
        case ERROR_CODE_CANCELED:
          return undefined;
        case ERROR_CODE_UNKNOWN:
        default:
          return this.$t('chat.message.errorUnknown');
      }
    },
    showBuyMore() {
      return this.message.role === ROLE_ASSISTANT && this.message.error?.code === ERROR_CODE_USED_UP;
    }
  },
  watch: {},
  methods: {
    startEditing() {
      this.isEditing = true;
      this.questionValue = this.message.content as string;
      console.debug('start to get answer', this.message);
    },
    cancelEdit() {
      this.isEditing = false;
    },
    onRestart() {
      this.$emit('restart', this.message);
    },
    onEdit() {
      this.isEditing = false;
      this.onSubmit();
    },
    onSubmit() {
      this.$emit('edit', this.message, this.questionValue);
    },
    onCopy() {
      copy(this.message.content!.toString(), {
        debug: true
      });
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
    onBuyMore() {
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_EXTRA,
        params: {
          id: this.application?.id
        }
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.error-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  width: fit-content;
  max-width: 100%;
  .error-content {
    display: flex;
    align-items: center;
    gap: 8px;
    .error-icon {
      color: var(--el-color-danger);
      font-size: 16px;
      flex-shrink: 0;
    }
    .error-text {
      font-size: 14px;
      color: var(--el-color-danger);
      line-height: 1.5;
    }
  }
  .btn-topup {
    flex-shrink: 0;
    border-radius: 20px;
    font-size: 13px;
    --el-button-bg-color: var(--el-color-primary);
    --el-button-border-color: var(--el-color-primary);
    --el-button-hover-bg-color: var(--el-color-primary-dark-2);
    --el-button-hover-border-color: var(--el-color-primary-dark-2);
  }
}

.message {
  display: flex;
  flex-direction: row;
  margin-bottom: 20px;

  &[role='system'] {
    display: none;
  }

  &.hidden {
    display: none;
  }

  .author {
    width: 44px;
    padding: 4px 8px 4px 0;
    flex-shrink: 0;
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--el-border-color-lighter);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
  }

  .main {
    flex: 1;
    width: calc(100% - 44px);
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &.assistant {
    align-items: start;
    .content {
      color: var(--el-text-color-primary);
    }
  }
  &.user {
    .main {
      align-items: flex-end;
    }
    .content {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-text-color-primary);
      position: relative;
      width: fit-content;
      max-width: 85%;
      border: 1px solid var(--el-color-primary-light-7);
      .edits {
        background-color: transparent;
        padding: 0;
        min-width: 500px;
        width: 100%;
        height: 100%;
        font-size: 15px;
        .btn-confirm {
          background-color: var(--el-color-primary);
          border-color: var(--el-color-primary);
          color: #fff;
        }
      }
      @media (max-width: 767px) {
        max-width: 90%;
        .edits {
          min-width: 280px;
        }
      }
    }
  }
  .content {
    border-radius: 16px;
    padding: 10px 16px;
    width: 100%;
    max-width: 800px;
    margin-bottom: 4px;
    line-height: 1.6;
    .image {
      max-width: 100%;
      max-height: 300px;
      margin: 5px 0;
      border-radius: 12px;
    }
    .edit-area {
      width: 100%;
      min-height: 100px;
      border-radius: 12px;
      padding: 8px;
      margin-bottom: 10px;
    }
    .edit-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  }

  .operations {
    display: flex;
    gap: 8px;
    margin-left: 4px;
    margin-top: 2px;
    color: var(--el-text-color-placeholder);
    .btn-edit {
      visibility: hidden;
    }
    .btn-restart {
      font-size: 12px;
    }
    .btn-copy {
      font-size: 12px;
    }
  }

  &:hover {
    .operations {
      color: var(--el-text-color-regular);
      .btn-edit {
        visibility: visible;
      }
    }
  }
}
</style>

<style lang="scss">
.message {
  &.user {
    .content {
      .edits {
        textarea {
          outline: none;
          box-shadow: none;
          border-radius: 0;
          resize: none;
          font-size: 16px;
          border-color: var(--el-bg-color-page);
          resize: none;
          background-color: var(--el-bg-color-page);
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}
</style>
