<template>
  <div
    :class="{
      message: true,
      [message.role as string]: true
    }"
    :role="message.role"
  >
    <div class="author">
      <el-image v-if="message.role === 'assistant'" :src="modelGroup.icon" fit="cover" class="avatar" />
    </div>
    <div v-if="!errorText" class="main">
      <div
        v-motion
        :initial="{ opacity: 0, y: 5 }"
        :enter="{ opacity: 1, y: 0, scale: 1 }"
        :delay="200"
        :duration="300"
        :layout="true"
        :transition="{
          enter: { delay: 0.2, duration: 0.5 },
          layout: { duration: 0.3, easing: 'ease-in-out' }
        }"
        class="content"
      >
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
              <file-preview
                v-if="item.file_url"
                :name="typeof item?.file_url === 'string' ? item.file_url : item.file_url?.url"
                :percentage="0"
                :closable="false"
                class="mt-2"
              />
              <markdown-renderer v-if="item.type === 'text'" :key="index" :content="item.text" />
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
      <div class="operations">
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
import EditMessage from './EditMessage.vue';
import FilePreview from './FilePreview.vue';
import ImagePreview from './ImagePreview.vue';
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
    EditMessage,
    CopyToClipboard,
    RestartToGenerate,
    AnsweringMark,
    MarkdownRenderer,
    ElAlert,
    FilePreview,
    ElButton,
    ElImage,
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
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    },
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
      .edits {
        background-color: var(--el-bg-color-page);
        padding: 0;
        min-width: 500px;
        width: 100%;
        height: 100%;
        font-size: 16px;
        .btn-confirm {
          background-color: var(--el-color-black);
          border-color: var(--el-color-black);
        }
      }
    }
  }
  .content {
    border-radius: 10px;
    padding: 8px 15px;
    width: 100%;
    max-width: 800px;
    margin-bottom: 5px;
    .image {
      max-width: 100%;
      max-height: 300px;
      margin: 5px 0;
      border-radius: 10px;
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
  }

  .operations {
    display: flex;
    gap: 10px;
    margin-left: 5px;
    color: var(--el-text-color-regular);
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
