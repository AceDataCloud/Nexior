<template>
  <markdown-renderer :content="content?.value" class="content" />
  <answering-mark v-if="shouldShowAnsweringMark" />
  <div class="alerts">
    <el-alert v-if="errorText" :title="errorText" type="error" :closable="false" />
  </div>
  <div class="operations pt-2 ml-2">
    <el-button v-if="shouldBuyMore" type="primary" size="small" @click="onBuyMore">{{
      $t('common.button.buyMore')
    }}</el-button>
  </div>
</template>

<script lang="ts">
import { IContent, IError, IMessageState } from '@/operators/message/models';
import { defineComponent } from 'vue';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { ElAlert, ElButton } from 'element-plus';
import {
  ERROR_CODE_API_ERROR,
  ERROR_CODE_BUSY,
  ERROR_CODE_BAD_REQUEST,
  ERROR_CODE_NO_CONVERSATION,
  ERROR_CODE_USED_UP
} from '@/constants';
import AnsweringMark from './AnsweringMark.vue';

export default defineComponent({
  name: 'MessageContent',
  components: {
    MarkdownRenderer,
    ElAlert,
    AnsweringMark,
    ElButton
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
    shouldBuyMore() {
      // @ts-ignore
      return this.error?.code === ERROR_CODE_USED_UP;
    },
    errorText() {
      if (this.error?.code === ERROR_CODE_USED_UP) {
        return this.$t('conversation.message.errorUsedUp');
      }
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
  },
  methods: {
    onBuyMore() {
      window.open('https://data.zhishuyun.com/services/b1fbcc32-e218-4253-9dc3-4fe600a1bfb9', '_blank');
    }
  }
});
</script>

<style lang="scss">
.content {
  overflow-x: hidden;
}
</style>
