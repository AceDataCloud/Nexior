<template>
  <div
    :class="{
      message: true,
      [message.role as string]: true
    }"
    :role="message.role"
  >
    <div class="author">
      <el-image
        v-if="message.role === 'assistant'"
        src="https://cdn.acedata.cloud/7dljuv.png"
        fit="cover"
        class="avatar"
      />
    </div>
    <div v-if="!errorText" class="main">
      <div class="content">
        <div class="edit-left">
          <el-tooltip
            v-if="message.role === 'user' && !isEditing && !Array.isArray(message.content)"
            effect="dark"
            :content="$t('chat.button.edit')"
            placement="bottom"
          >
            <font-awesome-icon icon="fa-solid fa-edit" class="icon icon-edit" @click="startEditing" />
          </el-tooltip>
        </div>
        <div v-if="!isEditing" class="message-content">
          <markdown-renderer v-if="!Array.isArray(message.content)" :content="message?.content" />
          <div v-else>
            <div v-for="(item, index) in message.content" :key="index">
              <img
                v-if="item.type === 'image_url'"
                :src="typeof item?.image_url === 'string' ? item.image_url : item.image_url?.url"
                fit="cover"
                class="image"
              />
              <span v-if="item.type === 'file_url'" class="file">
                <font-awesome-icon icon="fa-regular fa-file" class="icon icon-file" />
                {{
                  typeof item?.file_url === 'string'
                    ? item.file_url?.split('/')?.slice(-1)?.[0]
                    : item.file_url?.url?.split('/')?.slice(-1)?.[0]
                }}
              </span>
              <markdown-renderer v-if="item.type === 'text'" :key="index" :content="item.text" />
            </div>
          </div>
        </div>
        <div v-else class="chat-container">
          <el-input
            v-model="questionValue"
            type="textarea"
            class="chat-input"
            @keydown.enter.exact.prevent="sendEdit"
          ></el-input>
          <div class="button-group">
            <el-button size="small" round @click="cancelEdit">{{ $t('common.button.cancel') }}</el-button>
            <el-button type="primary" size="small" round @click="sendEdit">{{ $t('common.button.confirm') }}</el-button>
          </div>
        </div>
        <answering-mark v-if="message.state === messageState.PENDING" />
      </div>
      <div class="operations">
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
          @restart="sendRestart"
        />
      </div>
    </div>
    <el-alert v-else class="error" :title="errorText" type="error" :closable="false" />
    <el-button v-if="showBuyMore" round type="primary" class="btn btn-buy" size="small" @click="onBuyMore">
      {{ $t('common.button.buyMore') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AnsweringMark from './AnsweringMark.vue';
import copy from 'copy-to-clipboard';
import { ElAlert, ElButton, ElImage, ElTooltip, ElInput } from 'element-plus';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IApplication, IChatMessage, IChatMessageState } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import RestartToGenerate from './RestartToGenerate.vue';
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
  ROLE_ASSISTANT
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
    CopyToClipboard,
    RestartToGenerate,
    AnsweringMark,
    MarkdownRenderer,
    ElAlert,
    ElButton,
    ElImage,
    ElTooltip,
    FontAwesomeIcon,
    ElInput
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
    errorText() {
      if (!this.message.error || !this.message.error?.code) {
        return undefined;
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
        case ERROR_CODE_TOO_MANY_REQUESTS:
          return this.$t('chat.message.errorTooManyRequests');
        case ERROR_CODE_CONTENT_TOO_LARGE:
          return this.$t('chat.message.errorContentTooLarge');
        case ERROR_CODE_NOT_APPLIED:
          return this.$t('chat.message.errorNotApplied');
        case ERROR_CODE_CANCELED:
          return undefined; // 不显示错误框
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
    sendRestart() {
      // Implement the logic to save the edited content
      this.$emit('restart', this.message);
    },
    sendEdit() {
      // Implement the logic to save the edited content
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
.error {
  width: fit-content;
  padding: 10px 5px 8px 5px;
  height: 45px;
  border-radius: 10px;
  border-bottom-left-radius: 0;
}

.btn-buy {
  margin: 10px auto;
  border-radius: 20px;
}
.message {
  display: flex;
  flex-direction: row;
  margin-bottom: 15px;

  &[role='system'] {
    display: none;
  }

  &.hidden {
    display: none;
  }

  .author {
    width: 50px;
    padding: 10px;
    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1px solid var(--el-border-color);
    }
  }

  .main {
    flex: 1;
    width: calc(100% - 50px);
    display: flex;
    flex-direction: column;
  }

  &.assistant {
    align-items: start;
    .content {
      color: var(--el-text-color-primary);
    }
    .btn-buy {
      display: inline-block;
      margin-left: 5px;
    }
  }
  &.user {
    .main {
      align-items: end;
    }
    .content {
      background-color: var(--el-bg-color-page);
      color: var(--el-text-color-primary);
      width: fit-content;
      text-align: left;
      max-width: 100%;
      position: relative;
      .edit-left {
        position: absolute;
        left: -25px; /* Adjust as needed */
        top: 50%;
        transform: translateY(-50%);
      }
      .chat-container {
        // background-color: var(--el-bg-color-page);
        // color: var(--el-text-color-primary);
        padding: 10px;
        min-width: 400px;
        width: 100%;
        height: 100%;
        .chat-input {
          // background-color: var(--el-bg-color-page);
          // color: var(--el-text-color-primary);
          padding-bottom: 30px; /* 为按钮预留空间 */
        }

        .button-group {
          position: absolute;
          bottom: 10px;
          right: 10px;
        }
      }
    }
  }
  .content {
    border-radius: 20px;
    padding: 8px;
    width: 100%;
    max-width: 800px;
    margin-bottom: 10px;
    .image {
      max-width: 100%;
      max-height: 300px;
      margin: 5px 0;
      border-radius: 10px;
    }
    .file {
      display: block;
      margin: 5px 0;
      border-radius: 10px;
      padding: 5px 10px;
      background-color: var(--el-bg-color);
      color: var(--el-text-color-regular);
      border: 1px solid var(--el-border-color);
      font-size: 14px;
    }
    .edit-area {
      width: 100%;
      min-height: 100px;
      border-radius: 10px;
      padding: 8px;
      margin-bottom: 10px;
    }
    .edit-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .icon-edit {
      font-size: 14px;
      cursor: pointer;
      color: var(--el-text-color-regular);
    }
  }

  .operations {
    display: flex; // Use flexbox for better alignment
    gap: 10px; // Adjust the gap value as needed
    margin-left: 5px; // Adjust the value as needed
    color: var(--el-text-color-regular);
    .btn-restart {
      font-size: 14px;
    }
    .btn-copy {
      font-size: 14px;
    }
  }
}
</style>
