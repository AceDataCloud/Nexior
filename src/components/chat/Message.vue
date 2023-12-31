<template>
  <div :class="'message ' + message.role" :role="message.role">
    <div class="content">
      <markdown-renderer v-if="!Array.isArray(message.content)" :content="message?.content" />
      <div v-else>
        <div v-for="(item, index) in message.content" :key="index">
          <img v-if="item.type === 'image_url'" :src="item.image_url" fit="cover" class="image" />
          <markdown-renderer v-if="item.type === 'text'" :key="index" :content="item.text" />
        </div>
      </div>
      <answering-mark v-if="message.state === messageState.PENDING" />
      <el-alert v-if="errorText && message.role === 'assistant'" :title="errorText" type="error" :closable="false" />
    </div>
    <div class="operations">
      <copy-to-clipboard v-if="!Array.isArray(message.content)" :content="message.content" class="btn-copy" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AnsweringMark from './AnsweringMark.vue';
import copy from 'copy-to-clipboard';
import { ElAlert } from 'element-plus';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { IChatMessage, IChatMessageState } from '@/operators';
import CopyToClipboard from '../common/CopyToClipboard.vue';
import {
  ERROR_CODE_API_ERROR,
  ERROR_CODE_BAD_REQUEST,
  ERROR_CODE_CONTENT_TOO_LARGE,
  ERROR_CODE_TIMEOUT,
  ERROR_CODE_TOO_MANY_REQUESTS,
  ERROR_CODE_UNKNOWN,
  ERROR_CODE_USED_UP
} from '@/constants';
interface IData {
  copied: boolean;
  messageState: typeof IChatMessageState;
}

export default defineComponent({
  name: 'Message',
  components: {
    CopyToClipboard,
    AnsweringMark,
    MarkdownRenderer,
    ElAlert
  },
  props: {
    message: {
      type: Object as () => IChatMessage,
      required: true
    }
  },
  emits: ['stop'],
  data(): IData {
    return {
      copied: false,
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
        case ERROR_CODE_UNKNOWN:
        default:
          return this.$t('chat.message.errorUnknown');
      }
    }
  },
  methods: {
    onCopy() {
      copy(this.message.content.toString(), {
        debug: true
      });
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    }
    // onStop() {
    //   this.$emit('stop');
    // }
  }
});
</script>

<style lang="scss" scoped>
.message {
  display: flex;
  flex-direction: column;
  &[role='system'] {
    display: none;
  }
  &.assistant {
    align-items: start;
    .content {
      background-color: var(--el-bg-color-page);
      color: var(--el-color-black);
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
