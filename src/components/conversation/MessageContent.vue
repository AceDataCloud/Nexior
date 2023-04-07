<template>
  <markdown-renderer :content="content?.value" />
  <answering-mark v-if="shouldShowAnsweringMark" />
  <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />
</template>

<script lang="ts">
import { IContent, IError, IMessageState } from '@/operators/message/models';
import { defineComponent } from 'vue';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { ElAlert } from 'element-plus';
import { ERROR_CODE_API_ERROR, ERROR_CODE_BUSY, ERROR_CODE_BAD_REQUEST, ERROR_CODE_NO_CONVERSATION } from '@/constants';
import AnsweringMark from './AnsweringMark.vue';

export default defineComponent({
  name: 'MessageContent',
  components: {
    MarkdownRenderer,
    ElAlert,
    AnsweringMark
  },
  props: {
    content: {
      type: Object as () => IContent,
      required: true
    },
    error: {
      type: Object as () => IError | undefined,
      required: false,
      default() {
        return undefined;
      }
    },
    state: {
      type: Object as () => IMessageState,
      required: false,
      default() {
        return IMessageState.FINISHED;
      }
    }
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    },
    shouldShowAnsweringMark() {
      // @ts-ignore
      return this.state === IMessageState.PENDING;
    },
    errorText() {
      if (this.error?.code === ERROR_CODE_BUSY) {
        return this.$t('conversation.message.errorBusy');
      }
      if (this.error?.code === ERROR_CODE_API_ERROR) {
        return this.$t('conversation.message.errorApiError');
      }
      if (this.error?.code === ERROR_CODE_BAD_REQUEST) {
        return this.$t('conversation.message.errorBadRequest');
      }
      if (this.error?.code === ERROR_CODE_NO_CONVERSATION) {
        return this.$t('conversation.message.errorNoConversation');
      }
      return undefined;
    }
  }
});
</script>
