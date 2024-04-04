<template>
  <div
    :class="{
      message: true,
      [message.role as string]: true,
      hidden: errorText && message.role === 'assistant'
    }"
    :role="message.role"
  >
    <div class="content">
      <markdown-renderer :content="message?.content" />
      <answering-mark v-if="message.state === messageState.PENDING" />
    </div>
    <div class="operations">
      <copy-to-clipboard :content="message.content!" class="btn-copy" />
    </div>
  </div>
  <el-alert v-if="errorText" class="error" :title="errorText" type="error" :closable="false" />
  <el-button v-if="showBuyMore" round type="primary" class="btn btn-buy" size="small" @click="onBuyMore">
    {{ $t('common.button.buyMore') }}
  </el-button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AnsweringMark from './AnsweringMark.vue';
import copy from 'copy-to-clipboard';
import { ElAlert, ElButton } from 'element-plus';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { IChatdocMessage, IChatdocMessageState } from '@/models';
import CopyToClipboard from '../common/CopyToClipboard.vue';
import {
  ERROR_CODE_API_ERROR,
  ERROR_CODE_BAD_REQUEST,
  ERROR_CODE_CONTENT_TOO_LARGE,
  ERROR_CODE_NOT_APPLIED,
  ERROR_CODE_TIMEOUT,
  ERROR_CODE_TOO_MANY_REQUESTS,
  ERROR_CODE_UNKNOWN,
  ERROR_CODE_USED_UP,
  ROLE_ASSISTANT
} from '@/constants';
import message from '@/i18n/zh/common/message';

interface IData {
  copied: boolean;
  messageState: typeof IChatdocMessageState;
}

export default defineComponent({
  name: 'Message',
  components: {
    CopyToClipboard,
    AnsweringMark,
    MarkdownRenderer,
    ElAlert,
    ElButton
  },
  props: {
    message: {
      type: Object as () => IChatdocMessage,
      required: true
    }
  },
  emits: ['stop'],
  data(): IData {
    return {
      copied: false,
      messageState: IChatdocMessageState
    };
  },
  computed: {
    errorText() {
      if (!this.message.error || !this.message.error?.code) {
        return undefined;
      }
      switch (this.message.error?.code) {
        case ERROR_CODE_USED_UP:
          return this.$t('chatdoc.message.errorUsedUp');
        case ERROR_CODE_API_ERROR:
          return this.$t('chatdoc.message.errorApiError');
        case ERROR_CODE_BAD_REQUEST:
          return this.$t('chatdoc.message.errorBadRequest');
        case ERROR_CODE_TIMEOUT:
          return this.$t('chatdoc.message.errorTimeout');
        case ERROR_CODE_TOO_MANY_REQUESTS:
          return this.$t('chatdoc.message.errorTooManyRequests');
        case ERROR_CODE_CONTENT_TOO_LARGE:
          return this.$t('chatdoc.message.errorContentTooLarge');
        case ERROR_CODE_NOT_APPLIED:
          return this.$t('chatdoc.message.errorNotApplied');
        case ERROR_CODE_UNKNOWN:
        default:
          return this.$t('chatdoc.message.errorUnknown');
      }
    },
    showBuyMore() {
      return this.message.role === ROLE_ASSISTANT && this.message.error?.code === ERROR_CODE_USED_UP;
    }
  },
  methods: {
    onCopy() {
      copy(this.message.content!.toString(), {
        debug: true
      });
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
    onBuyMore() {}
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
  flex-direction: column;
  margin-bottom: 15px;
  &[role='system'] {
    display: none;
  }
  &.hidden {
    display: none;
  }
  &.assistant {
    align-items: start;
    .content {
      background-color: var(--el-bg-color-page);
      color: var(--el-text-color-primary);
      border-bottom-left-radius: 0;
    }
  }
  &.user {
    align-items: end;
    .content {
      background-color: var(--el-color-primary);
      color: var(--el-color-white);
      border-bottom-right-radius: 0;
    }
  }
  .content {
    border-radius: 10px;
    padding: 8px 15px;
    max-width: 800px;
    .image {
      max-width: 100%;
      max-height: 300px;
      margin: 5px 0;
      border-radius: 10px;
    }
  }

  .operations {
    display: block;
    .btn-copy {
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }
}
</style>
